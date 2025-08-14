import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DataverseClient } from "../dataverse-client.js";

// Helper function to build OData query parameters
function buildODataQuery(options: {
  select?: string[];
  filter?: string;
  orderby?: string;
  top?: number;
  skip?: number;
  expand?: string;
  count?: boolean;
}): string {
  const params: string[] = [];
  
  if (options.select && options.select.length > 0) {
    params.push(`$select=${options.select.join(',')}`);
  }
  
  if (options.filter) {
    params.push(`$filter=${encodeURIComponent(options.filter)}`);
  }
  
  if (options.orderby) {
    params.push(`$orderby=${encodeURIComponent(options.orderby)}`);
  }
  
  if (options.top) {
    params.push(`$top=${options.top}`);
  }
  
  if (options.skip) {
    params.push(`$skip=${options.skip}`);
  }
  
  if (options.expand) {
    params.push(`$expand=${encodeURIComponent(options.expand)}`);
  }
  
  if (options.count) {
    params.push(`$count=true`);
  }
  
  return params.length > 0 ? `?${params.join('&')}` : '';
}

// Helper function to generate headers
function generateHeaders(options: {
  prefer?: string[];
  ifMatch?: string;
  ifNoneMatch?: string;
  solutionUniqueName?: string;
  callerId?: string;
}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'OData-MaxVersion': '4.0',
    'OData-Version': '4.0'
  };
  
  if (options.prefer && options.prefer.length > 0) {
    headers['Prefer'] = options.prefer.join(', ');
  }
  
  if (options.ifMatch) {
    headers['If-Match'] = options.ifMatch;
  }
  
  if (options.ifNoneMatch) {
    headers['If-None-Match'] = options.ifNoneMatch;
  }
  
  if (options.solutionUniqueName) {
    headers['MSCRM.SolutionUniqueName'] = options.solutionUniqueName;
  }
  
  if (options.callerId) {
    headers['MSCRMCallerID'] = options.callerId;
  }
  
  return headers;
}

// Helper function to ensure entity set name has proper suffix
function formatEntitySetName(entityName: string): string {
  // Dataverse WebAPI URLs require entity names to be suffixed with 's' (pluralized)
  // If the name doesn't already end with 's', add it
  return entityName.endsWith('s') ? entityName : `${entityName}s`;
}

// Helper function to detect @odata.bind properties in request data
function hasODataBindProperties(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  return Object.keys(data).some(key => key.includes('@odata.bind'));
}

/**
* Validate, normalize, and fix @odata.bind values.
* - Keeps @odata.bind values RELATIVE (no base URL).
* - Normalizes absolute URLs or /api/data/v9.2/... to "/entityset(id)".
* - If the key uses the lookup attribute logical name instead of the navigation property,
*   it is rewritten to the correct "<navigationProperty>@odata.bind".
* - Also upgrades "attributeLogicalName" (without @odata.bind) when it looks like an entity ref.
*/
function processODataBindProperties(
 data: any,
 baseUrl: string,
 entityInfo?: {
   lookupNavMap?: Map<string, string>;
   attributes?: any[];
 }
): any {
 if (!data || typeof data !== 'object') return data;

 const processedData: Record<string, any> = { ...data };

 // Build quick lookup sets/maps for corrections
 const hasSchema = !!entityInfo;
 const navMap = entityInfo?.lookupNavMap || new Map<string, string>();
 const attrToNavLower = new Map<string, string>();
 for (const [attr, nav] of navMap.entries()) {
   attrToNavLower.set(String(attr).toLowerCase(), String(nav));
 }
 const isLookupAttr = (logicalName: string): boolean => {
   if (!entityInfo?.attributes) return false;
   const ln = logicalName.toLowerCase();
   const a = entityInfo.attributes.find((x: any) => String(x?.LogicalName).toLowerCase() === ln);
   return !!a && String(a.AttributeType).toLowerCase() === 'lookup';
 };

 // Helper to normalize values to relative "/entityset(id)" path
 const normalizeBindValue = (val: string): string => {
   if (!val || typeof val !== 'string') return val as any;
   // Strip full base URL + /api/data/v9.2 if present
   if (val.startsWith('http')) {
     const m = val.match(/\/api\/data\/v9\.2\/([^?]+)$/i);
     if (m && m[1]) {
       return `/${m[1]}`;
     }
     // Fallback: keep last path segment if it looks like "entityset(guid)"
     const last = val.split('/').pop() || '';
     if (/^[a-z0-9_]+\([^)]*\)$/i.test(last)) {
       return `/${last}`;
     }
     return val; // unknown absolute, return as-is
   }
   // Strip leading /api/data/v9.2
   if (val.startsWith('/api/data/v9.2/')) {
     return `/${val.substring('/api/data/v9.2/'.length)}`;
   }
   // Ensure leading slash
   if (!val.startsWith('/')) {
     return `/${val}`;
   }
   return val;
 };

 // First pass: correct keys that already use @odata.bind
 for (const key of Object.keys(processedData)) {
   if (!key.includes('@odata.bind')) continue;

   const value = processedData[key];
   // Keep null for disassociation
   if (value === null) {
     continue;
   }

   const rawProp = key.replace('@odata.bind', '');
   let correctedProp = rawProp;

   // If user used attribute logical name for a lookup instead of nav property, fix it
   if (hasSchema) {
     const nav = attrToNavLower.get(rawProp.toLowerCase());
     if (nav && nav !== rawProp) {
       correctedProp = nav;
     }
   }

   // If corrected, move value under the corrected key
   const targetKey = `${correctedProp}@odata.bind`;
   if (targetKey !== key) {
     // Only move if targetKey not already present
     if (processedData[targetKey] === undefined) {
       processedData[targetKey] = processedData[key];
     }
     delete processedData[key];
   }
 }

 // Second pass: normalize values to relative paths and upgrade plain logical-name keys when possible
 for (const key of Object.keys(processedData)) {
   const val = processedData[key];

   if (key.includes('@odata.bind')) {
     if (typeof val === 'string') {
       processedData[key] = normalizeBindValue(val);
     }
     continue;
   }

   // If user passed a lookup logical name without @odata.bind, and the value looks like an entity ref,
   // upgrade to "<nav>@odata.bind": "/entityset(guid)"
   if (hasSchema && isLookupAttr(key)) {
     const maybeStr = processedData[key];
     if (typeof maybeStr === 'string') {
       const looksLikeRef =
         maybeStr.startsWith('http') ||
         maybeStr.startsWith('/api/data/v9.2/') ||
         maybeStr.startsWith('/') ||
         /^[a-z0-9_]+\([^)]*\)$/i.test(maybeStr);

       if (looksLikeRef) {
         const nav = attrToNavLower.get(key.toLowerCase());
         if (nav) {
           const newKey = `${nav}@odata.bind`;
           if (processedData[newKey] === undefined) {
             processedData[newKey] = normalizeBindValue(maybeStr);
             delete processedData[key];
           }
         }
       }
     }
   }
 }

 return processedData;
}

// Helper function to extract navigation property examples from @odata.bind usage
function extractNavigationPropertyExamples(data: any): string[] {
  if (!data || typeof data !== 'object') return [];
  
  const examples: string[] = [];
  Object.keys(data).forEach(key => {
    if (key.includes('@odata.bind')) {
      const navigationProperty = key.replace('@odata.bind', '');
      const value = data[key];
      
      if (value === null) {
        examples.push(`// Disassociate relationship: "${navigationProperty}@odata.bind": null`);
      } else {
        examples.push(`// Associate with ${navigationProperty}: "${key}": "${value}"`);
      }
    }
  });
  
  return examples;
}

// Helper function to format the complete WebAPI call
function formatWebAPICall(
  baseUrl: string,
  method: string,
  endpoint: string,
  headers: Record<string, string>,
  body?: any
): string {
  const fullUrl = `${baseUrl}/api/data/v9.2/${endpoint}`;
  
  let result = `HTTP Method: ${method}\n`;
  result += `URL: ${fullUrl}\n\n`;
  result += `Headers:\n`;
  
  Object.entries(headers).forEach(([key, value]) => {
    result += `  ${key}: ${value}\n`;
  });
  
  if (body) {
    result += `\nRequest Body:\n`;
    result += JSON.stringify(body, null, 2);
  }
  
  return result;
}

/**
 * Resolve entity metadata (EntitySetName, primary fields) and attribute schema,
 * including navigationProperty mapping for lookup columns.
 * Accepts either a logical entity name or an entity set name and normalizes accordingly.
 */
async function resolveEntityInfo(client: DataverseClient, nameOrSet?: string): Promise<{
  logicalName: string;
  entitySetName: string;
  primaryIdAttribute: string;
  primaryNameAttribute?: string;
  attributes: any[];
  lookupNavMap: Map<string, string>;
}> {
  if (!nameOrSet) {
    return {
      logicalName: '',
      entitySetName: '',
      primaryIdAttribute: '',
      primaryNameAttribute: undefined,
      attributes: [],
      lookupNavMap: new Map()
    };
  }

  // Try to get by LogicalName directly with robust fallback
  const tryGetByLogicalName = async (ln: string) => {
    try {
      return await client.getMetadata(
        `EntityDefinitions(LogicalName='${ln}')?$select=EntitySetName,PrimaryIdAttribute,PrimaryNameAttribute,LogicalName`
      );
    } catch {
      // Fallback without $select for environments that don't support it on singletons
      return await client.getMetadata(
        `EntityDefinitions(LogicalName='${ln}')`
      );
    }
  };

  // Try to get by EntitySetName (fallback)
  const tryGetByEntitySetName = async (esn: string) => {
    const resp = await client.getMetadata(
      `EntityDefinitions?$select=EntitySetName,LogicalName,PrimaryIdAttribute,PrimaryNameAttribute&$filter=EntitySetName eq '${esn}'`
    );
    return resp?.value?.[0];
  };

  let def: any | null = null;
  try {
    def = await tryGetByLogicalName(nameOrSet);
  } catch {
    // If endsWith 's', try trimming 's' as a heuristic for logical name
    if (nameOrSet.endsWith('s')) {
      try {
        def = await tryGetByLogicalName(nameOrSet.slice(0, -1));
      } catch {
        // ignore
      }
    }
  }
  if (!def) {
    try {
      def = await tryGetByEntitySetName(nameOrSet);
    } catch {
      // ignore
    }
  }
  if (!def) {
    // Last resort: return minimal info using naive pluralization
    return {
      logicalName: nameOrSet,
      entitySetName: nameOrSet.endsWith('s') ? nameOrSet : `${nameOrSet}s`,
      primaryIdAttribute: '',
      primaryNameAttribute: undefined,
      attributes: [],
      lookupNavMap: new Map()
    };
  }

  const logicalName: string = def.LogicalName;
  const entitySetName: string = def.EntitySetName;

  // Fetch attributes (robust with fallback: try $select, then full set)
  let attributes: any[] = [];
  try {
    const attrsResp = await client.getMetadata(
      `EntityDefinitions(LogicalName='${logicalName}')/Attributes?$select=LogicalName,AttributeType,IsValidForCreate,IsValidForUpdate,IsPrimaryId,IsPrimaryName,RequiredLevel,Targets`
    );
    attributes = attrsResp?.value || [];
  } catch {
    try {
      const attrsRespFull = await client.getMetadata(
        `EntityDefinitions(LogicalName='${logicalName}')/Attributes`
      );
      attributes = attrsRespFull?.value || [];
    } catch {
      attributes = [];
    }
  }

  // Build lookup navigation property map
  const navMap: Map<string, string> = new Map();
  try {
    const relResp = await client.getMetadata(
      `EntityDefinitions(LogicalName='${logicalName}')/ManyToOneRelationships?$select=ReferencingAttribute,ReferencingEntityNavigationPropertyName`
    );
    for (const rel of relResp?.value || []) {
      if (rel?.ReferencingAttribute && rel?.ReferencingEntityNavigationPropertyName) {
        navMap.set(rel.ReferencingAttribute, rel.ReferencingEntityNavigationPropertyName);
      }
    }
  } catch {
    // ignore nav map errors
  }

  return {
    logicalName,
    entitySetName,
    primaryIdAttribute: def.PrimaryIdAttribute,
    primaryNameAttribute: def.PrimaryNameAttribute,
    attributes,
    lookupNavMap: navMap
  };
}

/**
 * Resolve the actual EntitySetName for a target logical entity name using metadata,
 * with a fallback to naive pluralization. Results cached in the provided map.
 */
async function getTargetEntitySetName(
  client: DataverseClient,
  cache: Map<string, string>,
  targetLogicalName: string
): Promise<string> {
  const key = targetLogicalName.toLowerCase();
  if (cache.has(key)) return cache.get(key)!;
  try {
    const def = await client.getMetadata(
      `EntityDefinitions(LogicalName='${targetLogicalName}')`,
      { $select: 'EntitySetName' }
    );
    if (def?.EntitySetName) {
      cache.set(key, def.EntitySetName);
      return def.EntitySetName;
    }
  } catch {
    // ignore and fallback
  }
  const fallback = targetLogicalName.endsWith('s') ? targetLogicalName : `${targetLogicalName}s`;
  cache.set(key, fallback);
  return fallback;
}

/**
 * Generate a sample request body aligned to actual table schema.
 * - Uses PrimaryNameAttribute when valid for create.
 * - Includes a couple of required simple fields.
 * - Emits correct @odata.bind keys for lookup attributes using navigationProperty.
 */
async function generateSampleBodyFromSchema(
  entityInfo: {
    logicalName: string;
    primaryNameAttribute?: string;
    attributes: any[];
    lookupNavMap: Map<string, string>;
  },
  baseUrl: string,
  resolveTargetSet: (targetLogicalName: string) => Promise<string>,
  mode: 'create' | 'update' = 'create'
): Promise<any> {
  const body: Record<string, any> = {};

  const validFlag = mode === 'create' ? 'IsValidForCreate' : 'IsValidForUpdate';

  // Primary name first (if applicable to mode)
  if (entityInfo.primaryNameAttribute) {
    const primary = entityInfo.attributes.find(a =>
      a?.LogicalName?.toLowerCase() === entityInfo.primaryNameAttribute!.toLowerCase()
    );
    if (primary && (primary as any)?.[validFlag] === true) {
      body[entityInfo.primaryNameAttribute] = `Sample ${entityInfo.logicalName}`;
    }
  }

  // Up to 2 simple attributes
  const SIMPLE_TYPES = new Set(['string','memo','integer','decimal','double','money','boolean','datetime']);
  const simpleCandidates = entityInfo.attributes.filter(a => {
    const t = String(a?.AttributeType).toLowerCase();
    if (!SIMPLE_TYPES.has(t)) return false;
    if ((a as any)?.[validFlag] !== true) return false;
    if (a?.IsPrimaryId === true) return false;
    if (a?.IsPrimaryName === true) return false;
    if (mode === 'create') {
      const lvl = a?.RequiredLevel?.Value;
      return lvl === 'ApplicationRequired' || lvl === 'SystemRequired';
    }
    return true; // update: any updatable simple field
  }).slice(0, 2);

  for (const attr of simpleCandidates) {
    const t = String(attr.AttributeType).toLowerCase();
    if (t === 'boolean') {
      body[attr.LogicalName] = true;
    } else if (t === 'datetime') {
      body[attr.LogicalName] = new Date().toISOString();
    } else if (t === 'integer' || t === 'decimal' || t === 'double' || t === 'money') {
      body[attr.LogicalName] = 1;
    } else {
      body[attr.LogicalName] = `Example ${attr.LogicalName}`;
    }
  }

  // Include up to 2 lookup associations using navigationProperty
  const lookups = entityInfo.attributes.filter(a =>
    String(a?.AttributeType).toLowerCase() === 'lookup' && (a as any)?.[validFlag] === true
  ).slice(0, 2);

  for (const attr of lookups) {
    const navProp = entityInfo.lookupNavMap.get(attr.LogicalName);
    if (!navProp) continue;
    const targets: string[] = Array.isArray((attr as any)?.Targets) ? (attr as any).Targets : [];
    const targetLogical = targets?.[0];
    if (!targetLogical) continue;
    const targetSet = await resolveTargetSet(targetLogical);
    body[`${navProp}@odata.bind`] = `/${targetSet}(00000000-0000-0000-0000-000000000000)`;
  }

  return body;
}

export function generateWebAPICallTool(server: McpServer, client: DataverseClient) {
  server.registerTool(
    "generate_webapi_call",
    {
      title: "Generate Dataverse WebAPI Call",
      description: "Generate HTTP requests, curl commands, and JavaScript examples for Dataverse WebAPI operations. Supports all CRUD operations, associations, actions, and functions with proper OData query parameters and headers.",
      inputSchema: {
        operation: z.enum([
          "retrieve", "retrieveMultiple", "create", "update", "delete", "associate", "disassociate", "callAction", "callFunction"
        ]).describe("Type of operation to perform"),
        
        entitySetName: z.string().optional().describe("Entity set name or logical entity name (e.g., 'account', 'contact') - will be automatically suffixed with 's' for Dataverse API URLs"),
        entityId: z.string().optional().describe("Entity ID for single record operations"),
        
        // OData query options
        select: z.array(z.string()).optional().describe("Fields to select (e.g., ['name', 'emailaddress1'])"),
        filter: z.string().optional().describe("OData filter expression"),
        orderby: z.string().optional().describe("OData orderby expression"),
        top: z.number().optional().describe("Number of records to return"),
        skip: z.number().optional().describe("Number of records to skip"),
        expand: z.string().optional().describe("Related entities to expand"),
        count: z.boolean().optional().describe("Include count of records"),
        
        // Request body for create/update operations
        data: z.record(z.any()).optional().describe("Data to send in request body for create/update operations"),
        
        // Header options
        prefer: z.array(z.string()).optional().describe("Prefer header values (e.g., ['return=representation', 'odata.include-annotations=*'])"),
        ifMatch: z.string().optional().describe("If-Match header for conditional updates"),
        ifNoneMatch: z.string().optional().describe("If-None-Match header"),
        callerId: z.string().optional().describe("MSCRMCallerID header for impersonation"),
        
        // Association/Disassociation options
        relationshipName: z.string().optional().describe("Relationship name for associate/disassociate operations"),
        relatedEntitySetName: z.string().optional().describe("Related entity set name for associations"),
        relatedEntityId: z.string().optional().describe("Related entity ID for associations"),
        
        // Action/Function options
        actionOrFunctionName: z.string().optional().describe("Name of the action or function to call"),
        parameters: z.record(z.any()).optional().describe("Parameters for action/function calls"),
        
        // Additional options
        includeSolutionContext: z.boolean().default(true).describe("Include current solution context in headers"),
        includeAuthHeader: z.boolean().default(false).describe("Include Authorization header placeholder in output")
      }
    },
    async (params: any) => {
      try {
        const config = (client as any).config as { dataverseUrl: string };
        const baseUrl = config.dataverseUrl;
        
        let method = 'GET';
        let endpoint = '';
        let body: any = undefined;
        
        // Build headers
        const headerOptions: any = {
          prefer: params.prefer,
          ifMatch: params.ifMatch,
          ifNoneMatch: params.ifNoneMatch,
          callerId: params.callerId
        };
        
        if (params.includeSolutionContext) {
          const solutionContext = client.getSolutionContext();
          if (solutionContext) {
            headerOptions.solutionUniqueName = solutionContext.solutionUniqueName;
          }
        }
        
        const headers = generateHeaders(headerOptions);
        
        if (params.includeAuthHeader) {
          headers['Authorization'] = 'Bearer {ACCESS_TOKEN}';
        }
        
        // Build endpoint based on operation type
        // Resolve actual entity metadata so URLs and payloads match the real schema
        let entityInfo: any = null;
        let formattedEntitySetName = '';
        const targetEntitySetCache: Map<string, string> = new Map();

        if (params.entitySetName) {
          try {
            entityInfo = await resolveEntityInfo(client, params.entitySetName);
            formattedEntitySetName = entityInfo?.entitySetName || formatEntitySetName(params.entitySetName);
          } catch {
            formattedEntitySetName = formatEntitySetName(params.entitySetName);
          }
        }
        
        switch (params.operation) {
          case 'retrieve':
            if (!params.entitySetName || !params.entityId) {
              throw new Error('entitySetName and entityId are required for retrieve operation');
            }
            method = 'GET';
            endpoint = `${formattedEntitySetName}(${params.entityId})`;
            
            let retrieveSelect = params.select;
            if ((!retrieveSelect || retrieveSelect.length === 0) && entityInfo) {
              retrieveSelect = [entityInfo.primaryIdAttribute].filter(Boolean) as string[];
              if (entityInfo.primaryNameAttribute) retrieveSelect.push(entityInfo.primaryNameAttribute);
            }

            const retrieveQuery = buildODataQuery({
              select: retrieveSelect,
              expand: params.expand
            });
            endpoint += retrieveQuery;
            break;
            
          case 'retrieveMultiple':
            if (!params.entitySetName) {
              throw new Error('entitySetName is required for retrieveMultiple operation');
            }
            method = 'GET';
            endpoint = formattedEntitySetName;
            
            let listSelect = params.select;
            if ((!listSelect || listSelect.length === 0) && entityInfo) {
              listSelect = [entityInfo.primaryIdAttribute].filter(Boolean) as string[];
              if (entityInfo.primaryNameAttribute) listSelect.push(entityInfo.primaryNameAttribute);
            }

            const retrieveMultipleQuery = buildODataQuery({
              select: listSelect,
              filter: params.filter,
              orderby: params.orderby,
              top: params.top,
              skip: params.skip,
              expand: params.expand,
              count: params.count
            });
            endpoint += retrieveMultipleQuery;
            break;
            
          case 'create':
            if (!params.entitySetName) {
              throw new Error('entitySetName is required for create operation');
            }
            method = 'POST';
            endpoint = formattedEntitySetName;
            // If data is provided, process @odata.bind; otherwise generate a schema-aligned sample body
            if (params.data) {
              body = processODataBindProperties(params.data, baseUrl, entityInfo);
            } else if (entityInfo) {
              body = await generateSampleBodyFromSchema(
                entityInfo,
                baseUrl,
                async (targetLogicalName: string) => await getTargetEntitySetName(client, targetEntitySetCache, targetLogicalName),
                'create'
              );
              // Ensure at least primary name is included if generation returned empty
              if (body && Object.keys(body).length === 0) {
                const primaryFromFlag = entityInfo.attributes?.find((a: any) => a?.IsPrimaryName)?.LogicalName;
                const primary = entityInfo.primaryNameAttribute || primaryFromFlag;
                if (primary) {
                  body[primary] = `Sample ${entityInfo.logicalName}`;
                }
              }
            } else {
              body = {}; // fallback empty body
            }
            break;
            
          case 'update':
            if (!params.entitySetName || !params.entityId) {
              throw new Error('entitySetName and entityId are required for update operation');
            }
            method = 'PATCH';
            endpoint = `${formattedEntitySetName}(${params.entityId})`;
            // Process @odata.bind properties for associations/disassociations on update, or generate a schema-aligned sample body
            if (params.data) {
              body = processODataBindProperties(params.data, baseUrl, entityInfo);
            } else if (entityInfo) {
              body = await generateSampleBodyFromSchema(
                entityInfo,
                baseUrl,
                async (targetLogicalName: string) => await getTargetEntitySetName(client, targetEntitySetCache, targetLogicalName),
                'update'
              );
              // Ensure at least one field present if generation returned empty
              if (body && Object.keys(body).length === 0) {
                const primaryFromFlag = entityInfo.attributes?.find((a: any) => a?.IsPrimaryName)?.LogicalName;
                const primary = entityInfo.primaryNameAttribute || primaryFromFlag;
                if (primary) {
                  body[primary] = `Updated ${entityInfo.logicalName}`;
                }
              }
            } else {
              body = {}; // fallback empty body
            }
            break;
            
          case 'delete':
            if (!params.entitySetName || !params.entityId) {
              throw new Error('entitySetName and entityId are required for delete operation');
            }
            method = 'DELETE';
            endpoint = `${formattedEntitySetName}(${params.entityId})`;
            break;
            
          case 'associate':
            if (!params.entitySetName || !params.entityId || !params.relationshipName || !params.relatedEntitySetName || !params.relatedEntityId) {
              throw new Error('entitySetName, entityId, relationshipName, relatedEntitySetName, and relatedEntityId are required for associate operation');
            }
            const formattedRelatedEntitySetName = formatEntitySetName(params.relatedEntitySetName);
            method = 'POST';
            endpoint = `${formattedEntitySetName}(${params.entityId})/${params.relationshipName}/$ref`;
            body = {
              "@odata.id": `${baseUrl}/api/data/v9.2/${formattedRelatedEntitySetName}(${params.relatedEntityId})`
            };
            break;
            
          case 'disassociate':
            if (!params.entitySetName || !params.entityId || !params.relationshipName) {
              throw new Error('entitySetName, entityId, and relationshipName are required for disassociate operation');
            }
            method = 'DELETE';
            if (params.relatedEntityId) {
              endpoint = `${formattedEntitySetName}(${params.entityId})/${params.relationshipName}(${params.relatedEntityId})/$ref`;
            } else {
              endpoint = `${formattedEntitySetName}(${params.entityId})/${params.relationshipName}/$ref`;
            }
            break;
            
          case 'callAction':
            if (!params.actionOrFunctionName) {
              throw new Error('actionOrFunctionName is required for callAction operation');
            }
            method = 'POST';
            if (params.entitySetName && params.entityId) {
              endpoint = `${formattedEntitySetName}(${params.entityId})/Microsoft.Dynamics.CRM.${params.actionOrFunctionName}`;
            } else {
              endpoint = params.actionOrFunctionName;
            }
            body = params.parameters || {};
            break;
            
          case 'callFunction':
            if (!params.actionOrFunctionName) {
              throw new Error('actionOrFunctionName is required for callFunction operation');
            }
            method = 'GET';
            let functionEndpoint = params.actionOrFunctionName;
            
            if (params.parameters && Object.keys(params.parameters).length > 0) {
              const paramStrings = Object.entries(params.parameters).map(([key, value]) => {
                if (typeof value === 'string') {
                  return `${key}='${value}'`;
                } else {
                  return `${key}=${value}`;
                }
              });
              functionEndpoint += `(${paramStrings.join(',')})`;
            }
            
            if (params.entitySetName && params.entityId) {
              endpoint = `${formattedEntitySetName}(${params.entityId})/Microsoft.Dynamics.CRM.${functionEndpoint}`;
            } else {
              endpoint = functionEndpoint;
            }
            break;
            
          default:
            throw new Error(`Unsupported operation: ${params.operation}`);
        }
        
        // Final normalization: ensure all @odata.bind values are relative and keys use navigation properties
        if (body) {
          body = processODataBindProperties(body, baseUrl, entityInfo);
        }

        const webApiCall = formatWebAPICall(baseUrl, method, endpoint, headers, body);
        
        // Additional information
        let additionalInfo = '\n\n--- Additional Information ---\n';
        additionalInfo += `Operation Type: ${params.operation}\n`;
        
        if (params.entitySetName) {
          additionalInfo += `Entity Set: ${params.entitySetName}\n`;
          additionalInfo += `Formatted Entity Set: ${formattedEntitySetName}\n`;
          additionalInfo += `Dataverse WebAPI Format: /api/data/v9.2/[entitySetName]s (note: 's' suffix required)\n`;
        }
        
        if (params.entityId) {
          additionalInfo += `Entity ID: ${params.entityId}\n`;
        }
        
        // Add @odata.bind information if present
        if (body && hasODataBindProperties(body)) {
          additionalInfo += '\n--- @odata.bind Usage Detected ---\n';
          additionalInfo += 'This request uses @odata.bind syntax for relationship management:\n';
          
          const examples = extractNavigationPropertyExamples(body);
          examples.forEach(example => {
            additionalInfo += `${example}\n`;
          });
          
          additionalInfo += '\n@odata.bind Syntax Guide:\n';
          additionalInfo += '• Associate on Create/Update: "navigationProperty@odata.bind": "/entitysets(id)"\n';
          additionalInfo += '• Disassociate: "navigationProperty@odata.bind": null\n';
          additionalInfo += '• Single-valued navigation properties: For many-to-one relationships\n';
          additionalInfo += '• Collection-valued navigation properties: Use /$ref endpoints instead\n';
          additionalInfo += '• Full URL format: "https://org.crm.dynamics.com/api/data/v9.2/accounts(id)"\n';
          additionalInfo += '• Relative format: "/accounts(id)" (preferred; base URL is not used in @odata.bind)\n';
        }
        
        // Include curl command
        let curlCommand = `curl -X ${method} \\\n`;
        curlCommand += `  "${baseUrl}/api/data/v9.2/${endpoint}" \\\n`;
        
        Object.entries(headers).forEach(([key, value]) => {
          curlCommand += `  -H "${key}: ${value}" \\\n`;
        });
        
        if (body) {
          curlCommand += `  -d '${JSON.stringify(body)}'`;
        } else {
          curlCommand = curlCommand.slice(0, -3); // Remove trailing " \\"
        }
        
        additionalInfo += `\nCurl Command:\n${curlCommand}\n`;
        
        // Include JavaScript fetch example
        let fetchExample = `fetch('${baseUrl}/api/data/v9.2/${endpoint}', {\n`;
        fetchExample += `  method: '${method}',\n`;
        fetchExample += `  headers: ${JSON.stringify(headers, null, 4)},\n`;
        if (body) {
          fetchExample += `  body: JSON.stringify(${JSON.stringify(body, null, 4)})\n`;
        }
        fetchExample += `})\n.then(response => response.json())\n.then(data => console.log(data));`;
        
        additionalInfo += `\nJavaScript Fetch Example:\n${fetchExample}\n`;
        
        return {
          content: [
            {
              type: "text",
              text: `${webApiCall}${additionalInfo}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error generating WebAPI call: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}