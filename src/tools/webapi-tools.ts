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

// Helper function to validate and format @odata.bind values
function processODataBindProperties(data: any, baseUrl: string): any {
  if (!data || typeof data !== 'object') return data;
  
  const processedData = { ...data };
  
  Object.keys(processedData).forEach(key => {
    if (key.includes('@odata.bind')) {
      const value = processedData[key];
      
      // Handle null values for disassociation
      if (value === null) {
        return; // Keep null values as-is for disassociation
      }
      
      // Validate and format @odata.bind values
      if (typeof value === 'string') {
        // If it's already a full URL, keep it as-is
        if (value.startsWith('http')) {
          return;
        }
        
        // If it starts with '/', it's a relative path - make it absolute
        if (value.startsWith('/')) {
          processedData[key] = `${baseUrl}/api/data/v9.2${value}`;
        } else {
          // If it's just an entity reference like "accounts(id)", add the full path
          processedData[key] = `${baseUrl}/api/data/v9.2/${value}`;
        }
      }
    }
  });
  
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
        // Dataverse WebAPI URLs require entity names to be suffixed with 's' (pluralized)
        const formattedEntitySetName = params.entitySetName ? formatEntitySetName(params.entitySetName) : '';
        
        switch (params.operation) {
          case 'retrieve':
            if (!params.entitySetName || !params.entityId) {
              throw new Error('entitySetName and entityId are required for retrieve operation');
            }
            method = 'GET';
            endpoint = `${formattedEntitySetName}(${params.entityId})`;
            
            const retrieveQuery = buildODataQuery({
              select: params.select,
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
            
            const retrieveMultipleQuery = buildODataQuery({
              select: params.select,
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
            if (!params.entitySetName || !params.data) {
              throw new Error('entitySetName and data are required for create operation');
            }
            method = 'POST';
            endpoint = formattedEntitySetName;
            // Process @odata.bind properties for associations on create
            body = processODataBindProperties(params.data, baseUrl);
            break;
            
          case 'update':
            if (!params.entitySetName || !params.entityId || !params.data) {
              throw new Error('entitySetName, entityId, and data are required for update operation');
            }
            method = 'PATCH';
            endpoint = `${formattedEntitySetName}(${params.entityId})`;
            // Process @odata.bind properties for associations/disassociations on update
            body = processODataBindProperties(params.data, baseUrl);
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
          additionalInfo += '• Relative format: "/accounts(id)" (automatically converted to full URL)\n';
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