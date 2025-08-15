import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DataverseClient } from "../dataverse-client.js";

// Helper function to build OData query parameters for PowerPages
function buildPowerPagesODataQuery(options: {
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

// Helper function to detect @odata.bind properties in request data
function hasODataBindProperties(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  return Object.keys(data).some(key => key.includes('@odata.bind'));
}

/**
 * Validate, normalize, and fix @odata.bind values for PowerPages.
 * - Keeps @odata.bind values RELATIVE (no base URL).
 * - Normalizes absolute URLs or /_api/... to "/entityset(id)".
 * - If the key uses the lookup attribute logical name instead of the navigation property,
 *   it is rewritten to the correct "<navigationProperty>@odata.bind".
 * - Also upgrades "attributeLogicalName" (without @odata.bind) when it looks like an entity ref.
 */
function processPowerPagesODataBindProperties(
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

 // Helper to normalize values to relative "/_api/entityset(id)" path for PowerPages
 const normalizeBindValue = (val: string): string => {
   if (!val || typeof val !== 'string') return val as any;
   // Strip full base URL + /_api if present
   if (val.startsWith('http')) {
     const m = val.match(/\/_api\/([^?]+)$/i);
     if (m && m[1]) {
       return `/_api/${m[1]}`;
     }
     // Fallback: keep last path segment if it looks like "entityset(guid)"
     const last = val.split('/').pop() || '';
     if (/^[a-z0-9_]+\([^)]*\)$/i.test(last)) {
       return `/_api/${last}`;
     }
     return val; // unknown absolute, return as-is
   }
   // Strip leading /_api if already present
   if (val.startsWith('/_api/')) {
     return val;
   }
   // Ensure leading /_api/
   if (!val.startsWith('/')) {
     return `/_api/${val}`;
   }
   return `/_api${val}`;
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
   // upgrade to "<nav>@odata.bind": "/_api/entityset(guid)"
   if (hasSchema && isLookupAttr(key)) {
     const maybeStr = processedData[key];
     if (typeof maybeStr === 'string') {
       const looksLikeRef =
         maybeStr.startsWith('http') ||
         maybeStr.startsWith('/_api/') ||
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

/**
 * Resolve entity metadata (EntitySetName, primary fields) and attribute schema,
 * including navigationProperty mapping for lookup columns.
 * Accepts either a logical entity name or an entity set name and normalizes accordingly.
 */
async function resolvePowerPagesEntityInfo(client: DataverseClient, nameOrSet?: string): Promise<{
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
async function getPowerPagesTargetEntitySetName(
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
 * Generate a sample request body aligned to actual table schema for PowerPages.
 * - Uses PrimaryNameAttribute when valid for create.
 * - Includes a couple of required simple fields.
 * - Emits correct @odata.bind keys for lookup attributes using navigationProperty.
 */
async function generatePowerPagesSampleBodyFromSchema(
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
    body[`${navProp}@odata.bind`] = `/_api/${targetSet}(00000000-0000-0000-0000-000000000000)`;
  }

  return body;
}

export function generatePowerPagesWebAPICallTool(server: McpServer, client: DataverseClient) {
  server.registerTool(
    "generate_powerpages_webapi_call",
    {
      title: "Generate PowerPages WebAPI Call",
      description: "Generate PowerPages-specific API calls, JavaScript examples, and React components for Dataverse operations through PowerPages portals. Includes authentication context and portal-specific patterns.",
      inputSchema: {
        operation: z.enum([
          "retrieve", "retrieveMultiple", "create", "update", "delete"
        ]).describe("Type of operation to perform"),
        
        logicalEntityName: z.string().describe("Logical entity name (e.g., 'cr7ae_creditcardse', 'contact') - will be automatically suffixed with 's' for PowerPages API URLs"),
        entityId: z.string().optional().describe("Entity ID for single record operations (GUID)"),
        
        // OData query options
        select: z.array(z.string()).optional().describe("Fields to select (e.g., ['cr7ae_name', 'cr7ae_type'])"),
        filter: z.string().optional().describe("OData filter expression"),
        orderby: z.string().optional().describe("OData orderby expression"),
        top: z.number().optional().describe("Number of records to return"),
        skip: z.number().optional().describe("Number of records to skip"),
        expand: z.string().optional().describe("Related entities to expand"),
        count: z.boolean().optional().describe("Include count of records"),
        
        // Request body for create/update operations
        data: z.record(z.any()).optional().describe("Data to send in request body for create/update operations"),
        
        // PowerPages specific options
        baseUrl: z.string().optional().describe("PowerPages site base URL (e.g., 'https://yoursite.powerappsportals.com')"),
        requestVerificationToken: z.boolean().default(false).describe("Include __RequestVerificationToken placeholder for POST operations"),
        includeAuthContext: z.boolean().default(false).describe("Include authentication context information"),
        
        // Additional headers
        customHeaders: z.record(z.string()).optional().describe("Custom headers to include in the request")
      }
    },
    async (params: any) => {
      try {
        const baseUrl = params.baseUrl || 'https://yoursite.powerappsportals.com';
        
        // Resolve entity metadata for schema-aware capabilities
        let entityInfo: any = null;
        let entitySetName = '';
        let targetSetCache = new Map<string, string>();
        
        try {
          entityInfo = await resolvePowerPagesEntityInfo(client, params.logicalEntityName);
          entitySetName = entityInfo.entitySetName;
        } catch (error) {
          // Fallback to naive pluralization if metadata fails
          entitySetName = params.logicalEntityName ? 
            (params.logicalEntityName.endsWith('s') ? params.logicalEntityName : `${params.logicalEntityName}s`) : '';
        }

        let url = `${baseUrl}/_api/${entitySetName}`;
        let method = 'GET';
        let body: any = null;
        let headers: Record<string, string> = {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...params.customHeaders
        };

        // Add request verification token for POST operations if requested
        if (params.requestVerificationToken && ['create', 'update', 'delete'].includes(params.operation)) {
          headers['__RequestVerificationToken'] = '{{REQUEST_VERIFICATION_TOKEN}}';
        }

        // Helper to resolve target entity set names
        const resolveTargetSet = async (targetLogicalName: string): Promise<string> => {
          return await getPowerPagesTargetEntitySetName(client, targetSetCache, targetLogicalName);
        };

        switch (params.operation) {
          case 'retrieve':
            if (!params.entityId) {
              throw new Error("entityId is required for retrieve operation");
            }
            url += `(${params.entityId})`;
            
            // Auto-select primary fields if no select specified and we have schema
            let finalSelect = params.select;
            if (!params.select && entityInfo && entityInfo.primaryIdAttribute) {
              const autoFields = [entityInfo.primaryIdAttribute];
              if (entityInfo.primaryNameAttribute) {
                autoFields.push(entityInfo.primaryNameAttribute);
              }
              finalSelect = autoFields;
            }
            
            const queryParams = buildPowerPagesODataQuery({ select: finalSelect, expand: params.expand });
            if (queryParams) {
              url += queryParams;
            }
            break;

          case 'retrieveMultiple':
            // Auto-select primary fields if no select specified and we have schema
            let finalListSelect = params.select;
            if (!params.select && entityInfo && entityInfo.primaryIdAttribute) {
              const autoFields = [entityInfo.primaryIdAttribute];
              if (entityInfo.primaryNameAttribute) {
                autoFields.push(entityInfo.primaryNameAttribute);
              }
              finalListSelect = autoFields;
            }
            
            const listQueryParams = buildPowerPagesODataQuery({ 
              select: finalListSelect, 
              filter: params.filter, 
              orderby: params.orderby, 
              top: params.top, 
              skip: params.skip, 
              expand: params.expand, 
              count: params.count 
            });
            if (listQueryParams) {
              url += listQueryParams;
            }
            break;

          case 'create':
            method = 'POST';
            
            // Process @odata.bind properties and generate sample if no data provided
            if (params.data) {
              body = processPowerPagesODataBindProperties(params.data, baseUrl, entityInfo);
            } else if (entityInfo) {
              // Generate schema-aware sample body
              body = await generatePowerPagesSampleBodyFromSchema(entityInfo, baseUrl, resolveTargetSet, 'create');
            } else {
              body = {};
            }
            break;

          case 'update':
            if (!params.entityId) {
              throw new Error("entityId is required for update operation");
            }
            method = 'PATCH';
            url += `(${params.entityId})`;
            
            // Process @odata.bind properties and generate sample if no data provided
            if (params.data) {
              body = processPowerPagesODataBindProperties(params.data, baseUrl, entityInfo);
            } else if (entityInfo) {
              // Generate schema-aware sample body
              body = await generatePowerPagesSampleBodyFromSchema(entityInfo, baseUrl, resolveTargetSet, 'update');
            } else {
              body = {};
            }
            break;

          case 'delete':
            if (!params.entityId) {
              throw new Error("entityId is required for delete operation");
            }
            method = 'DELETE';
            url += `(${params.entityId})`;
            break;

          default:
            throw new Error(`Unsupported operation: ${params.operation}`);
        }

        // Generate examples
        const examples = [];

        // HTTP Request
        const httpRequest = [
          `${method} ${url} HTTP/1.1`,
          `Host: ${new URL(baseUrl).host}`,
          ...Object.entries(headers).map(([key, value]) => `${key}: ${value}`)
        ];

        if (body) {
          httpRequest.push('');
          httpRequest.push(JSON.stringify(body, null, 2));
        }

        examples.push({
          title: "HTTP Request",
          content: httpRequest.join('\n')
        });

        // cURL Command
        const curlParts = [`curl -X ${method}`];
        Object.entries(headers).forEach(([key, value]) => {
          curlParts.push(`-H "${key}: ${value}"`);
        });
        
        if (body) {
          curlParts.push(`-d '${JSON.stringify(body)}'`);
        }
        
        curlParts.push(`"${url}"`);

        examples.push({
          title: "cURL Command",
          content: curlParts.join(' \\\n  ')
        });

        // JavaScript Fetch
        const fetchOptions: any = {
          method,
          headers
        };

        if (body) {
          fetchOptions.body = JSON.stringify(body);
        }

        const jsCode = `
// PowerPages WebAPI ${params.operation} operation
fetch('${url}', ${JSON.stringify(fetchOptions, null, 2)})
  .then(response => {
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Success:', data);
  })
  .catch(error => {
    console.error('Error:', error);
  });`;

        examples.push({
          title: "JavaScript (Fetch API)",
          content: jsCode.trim()
        });

        // React Component Example
        const reactCode = `
import React, { useState, useEffect } from 'react';

const ${params.operation.charAt(0).toUpperCase() + params.operation.slice(1)}Component = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const perform${params.operation.charAt(0).toUpperCase() + params.operation.slice(1)} = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('${url}', ${JSON.stringify(fetchOptions, null, 6)});
      
      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  ${params.operation === 'retrieveMultiple' || params.operation === 'retrieve' ? `
  useEffect(() => {
    perform${params.operation.charAt(0).toUpperCase() + params.operation.slice(1)}();
  }, []);` : ''}

  return (
    <div>
      <h3>${params.operation.charAt(0).toUpperCase() + params.operation.slice(1)} ${params.logicalEntityName || 'Entity'}</h3>
      ${params.operation !== 'retrieveMultiple' && params.operation !== 'retrieve' ? `
      <button onClick={perform${params.operation.charAt(0).toUpperCase() + params.operation.slice(1)}} disabled={loading}>
        {loading ? 'Processing...' : '${params.operation.charAt(0).toUpperCase() + params.operation.slice(1)}'}
      </button>` : ''}
      
      {loading && <p>Loading...</p>}
      {error && <p style={{color: 'red'}}>Error: {error}</p>}
      {data && (
        <div>
          <h4>Result:</h4>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default ${params.operation.charAt(0).toUpperCase() + params.operation.slice(1)}Component;`;

        examples.push({
          title: "React Component",
          content: reactCode.trim()
        });

        // Add @odata.bind examples if present in the body
        if (body && hasODataBindProperties(body)) {
          const bindExamples = extractNavigationPropertyExamples(body);
          if (bindExamples.length > 0) {
            const odataBindInfo = `
## @odata.bind Relationship Examples

The request body includes relationship associations using @odata.bind:

\`\`\`javascript
${bindExamples.join('\n')}
\`\`\`

### @odata.bind Usage Patterns:

1. **Associate with existing record:**
   \`"navigationProperty@odata.bind": "/_api/entityset(guid)"\`

2. **Disassociate relationship:**
   \`"navigationProperty@odata.bind": null\`

3. **PowerPages URL Format:**
   - Use relative paths: \`/_api/contacts(guid)\`
   - Entity set names are typically plural: \`contacts\`, \`accounts\`, etc.

### Navigation Property Names:
${entityInfo && entityInfo.lookupNavMap.size > 0 ? 
  Array.from(entityInfo.lookupNavMap.entries())
    .map((entry: any) => {
      const [attr, nav] = entry as [string, string];
      return `- Lookup attribute \`${attr}\` → Navigation property \`${nav}\``;
    })
    .join('\n') :
  '- Navigation properties are automatically resolved from table schema'}`;

            examples.push({
              title: "@odata.bind Relationships",
              content: odataBindInfo.trim()
            });
          }
        }

        // Authentication context if requested
        if (params.includeAuthContext) {
          const authInfo = `
## Authentication Context for PowerPages

PowerPages uses different authentication mechanisms:

1. **Anonymous Access**: No authentication required for public data
2. **Authenticated Users**: Session-based authentication via portal login
3. **Request Verification Token**: Anti-CSRF protection for state-changing operations

### Getting Request Verification Token (JavaScript):
\`\`\`javascript
// Get the token from the page (usually in a hidden input or meta tag)
const token = document.querySelector('input[name="__RequestVerificationToken"]')?.value ||
              document.querySelector('meta[name="__RequestVerificationToken"]')?.content;

// Include in headers for POST/PATCH/DELETE operations
headers['__RequestVerificationToken'] = token;
\`\`\`

### User Context:
\`\`\`javascript
// Access current user information (if available)
const userContext = {
  isAuthenticated: window.Shell?.user?.isAuthenticated || false,
  userId: window.Shell?.user?.id,
  userName: window.Shell?.user?.displayName
};
\`\`\``;

          examples.push({
            title: "Authentication Information",
            content: authInfo.trim()
          });
        }

        // Add schema information if available
        if (entityInfo && entityInfo.logicalName) {
          const schemaInfo = `
## Schema Information

**Entity:** ${entityInfo.logicalName} (${entityInfo.entitySetName})
**Primary ID:** ${entityInfo.primaryIdAttribute || 'Not available'}
**Primary Name:** ${entityInfo.primaryNameAttribute || 'Not available'}

### Available Fields:
${entityInfo.attributes && entityInfo.attributes.length > 0 ?
  entityInfo.attributes
    .filter((attr: any) => attr?.LogicalName)
    .slice(0, 10) // Show first 10 fields
    .map((attr: any) => `- \`${attr.LogicalName}\` (${attr.AttributeType})`)
    .join('\n') +
  (entityInfo.attributes.length > 10 ? `\n- ... and ${entityInfo.attributes.length - 10} more fields` : '') :
  'Schema information not available'}

### Lookup Navigation Properties:
${entityInfo.lookupNavMap && entityInfo.lookupNavMap.size > 0 ?
  Array.from(entityInfo.lookupNavMap.entries())
    .map((entry: any) => {
      const [attr, nav] = entry as [string, string];
      return `- \`${attr}\` → \`${nav}\``;
    })
    .join('\n') :
  'No lookup relationships found'}`;

          examples.push({
            title: "Entity Schema",
            content: schemaInfo.trim()
          });
        }

        const result = examples.map(example =>
          `## ${example.title}\n\n\`\`\`${example.title.includes('React') ? 'jsx' : example.title.includes('JavaScript') ? 'javascript' : example.title.includes('cURL') ? 'bash' : example.title.includes('@odata.bind') || example.title.includes('Schema') || example.title.includes('Authentication') ? 'markdown' : 'http'}\n${example.content}\n\`\`\``
        ).join('\n\n');

        return {
          content: [
            {
              type: "text",
              text: result
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error generating PowerPages WebAPI call: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}