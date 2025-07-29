import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
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
  return entityName.endsWith('s') ? entityName : `${entityName}s`;
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

// Generate WebAPI code examples based on parameters
function generateWebAPIExamples(
  client: DataverseClient,
  operation: string,
  entitySetName?: string,
  entityId?: string,
  options: {
    select?: string[];
    filter?: string;
    orderby?: string;
    top?: number;
    skip?: number;
    expand?: string;
    count?: boolean;
    data?: any;
    prefer?: string[];
    ifMatch?: string;
    ifNoneMatch?: string;
    callerId?: string;
    relationshipName?: string;
    relatedEntitySetName?: string;
    relatedEntityId?: string;
    actionOrFunctionName?: string;
    parameters?: any;
    includeSolutionContext?: boolean;
    includeAuthHeader?: boolean;
  } = {}
): string {
  try {
    const config = (client as any).config as { dataverseUrl: string };
    const baseUrl = config.dataverseUrl;
    
    let method = 'GET';
    let endpoint = '';
    let body: any = undefined;
    
    // Build headers
    const headerOptions: any = {
      prefer: options.prefer,
      ifMatch: options.ifMatch,
      ifNoneMatch: options.ifNoneMatch,
      callerId: options.callerId
    };
    
    if (options.includeSolutionContext !== false) {
      const solutionContext = client.getSolutionContext();
      if (solutionContext) {
        headerOptions.solutionUniqueName = solutionContext.solutionUniqueName;
      }
    }
    
    const headers = generateHeaders(headerOptions);
    
    if (options.includeAuthHeader) {
      headers['Authorization'] = 'Bearer {ACCESS_TOKEN}';
    }
    
    // Build endpoint based on operation type
    const formattedEntitySetName = entitySetName ? formatEntitySetName(entitySetName) : '';
    
    switch (operation) {
      case 'retrieve':
        if (!entitySetName || !entityId) {
          throw new Error('entitySetName and entityId are required for retrieve operation');
        }
        method = 'GET';
        endpoint = `${formattedEntitySetName}(${entityId})`;
        
        const retrieveQuery = buildODataQuery({
          select: options.select,
          expand: options.expand
        });
        endpoint += retrieveQuery;
        break;
        
      case 'retrieveMultiple':
        if (!entitySetName) {
          throw new Error('entitySetName is required for retrieveMultiple operation');
        }
        method = 'GET';
        endpoint = formattedEntitySetName;
        
        const retrieveMultipleQuery = buildODataQuery({
          select: options.select,
          filter: options.filter,
          orderby: options.orderby,
          top: options.top,
          skip: options.skip,
          expand: options.expand,
          count: options.count
        });
        endpoint += retrieveMultipleQuery;
        break;
        
      case 'create':
        if (!entitySetName || !options.data) {
          throw new Error('entitySetName and data are required for create operation');
        }
        method = 'POST';
        endpoint = formattedEntitySetName;
        body = options.data;
        break;
        
      case 'update':
        if (!entitySetName || !entityId || !options.data) {
          throw new Error('entitySetName, entityId, and data are required for update operation');
        }
        method = 'PATCH';
        endpoint = `${formattedEntitySetName}(${entityId})`;
        body = options.data;
        break;
        
      case 'delete':
        if (!entitySetName || !entityId) {
          throw new Error('entitySetName and entityId are required for delete operation');
        }
        method = 'DELETE';
        endpoint = `${formattedEntitySetName}(${entityId})`;
        break;
        
      case 'associate':
        if (!entitySetName || !entityId || !options.relationshipName || !options.relatedEntitySetName || !options.relatedEntityId) {
          throw new Error('entitySetName, entityId, relationshipName, relatedEntitySetName, and relatedEntityId are required for associate operation');
        }
        const formattedRelatedEntitySetName = formatEntitySetName(options.relatedEntitySetName);
        method = 'POST';
        endpoint = `${formattedEntitySetName}(${entityId})/${options.relationshipName}/$ref`;
        body = {
          "@odata.id": `${baseUrl}/api/data/v9.2/${formattedRelatedEntitySetName}(${options.relatedEntityId})`
        };
        break;
        
      case 'disassociate':
        if (!entitySetName || !entityId || !options.relationshipName) {
          throw new Error('entitySetName, entityId, and relationshipName are required for disassociate operation');
        }
        method = 'DELETE';
        if (options.relatedEntityId) {
          endpoint = `${formattedEntitySetName}(${entityId})/${options.relationshipName}(${options.relatedEntityId})/$ref`;
        } else {
          endpoint = `${formattedEntitySetName}(${entityId})/${options.relationshipName}/$ref`;
        }
        break;
        
      case 'callAction':
        if (!options.actionOrFunctionName) {
          throw new Error('actionOrFunctionName is required for callAction operation');
        }
        method = 'POST';
        if (entitySetName && entityId) {
          endpoint = `${formattedEntitySetName}(${entityId})/Microsoft.Dynamics.CRM.${options.actionOrFunctionName}`;
        } else {
          endpoint = options.actionOrFunctionName;
        }
        body = options.parameters || {};
        break;
        
      case 'callFunction':
        if (!options.actionOrFunctionName) {
          throw new Error('actionOrFunctionName is required for callFunction operation');
        }
        method = 'GET';
        let functionEndpoint = options.actionOrFunctionName;
        
        if (options.parameters && Object.keys(options.parameters).length > 0) {
          const paramStrings = Object.entries(options.parameters).map(([key, value]) => {
            if (typeof value === 'string') {
              return `${key}='${value}'`;
            } else {
              return `${key}=${value}`;
            }
          });
          functionEndpoint += `(${paramStrings.join(',')})`;
        }
        
        if (entitySetName && entityId) {
          endpoint = `${formattedEntitySetName}(${entityId})/Microsoft.Dynamics.CRM.${functionEndpoint}`;
        } else {
          endpoint = functionEndpoint;
        }
        break;
        
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
    
    const webApiCall = formatWebAPICall(baseUrl, method, endpoint, headers, body);
    
    // Additional information
    let additionalInfo = '\n\n--- Additional Information ---\n';
    additionalInfo += `Operation Type: ${operation}\n`;
    
    if (entitySetName) {
      additionalInfo += `Entity Set: ${entitySetName}\n`;
      additionalInfo += `Formatted Entity Set: ${formattedEntitySetName}\n`;
      additionalInfo += `Dataverse WebAPI Format: /api/data/v9.2/[entitySetName]s (note: 's' suffix required)\n`;
    }
    
    if (entityId) {
      additionalInfo += `Entity ID: ${entityId}\n`;
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
    
    return `${webApiCall}${additionalInfo}`;
  } catch (error) {
    return `Error generating WebAPI call: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

export function registerWebAPIResources(server: McpServer, client: DataverseClient) {
  // Register WebAPI code generation resource with proper template
  server.registerResource(
    "webapi-call",
    new ResourceTemplate("webapi://{operation}/{entitySetName?}/{entityId?}", {
      list: async () => {
        // Return some example URIs for discovery
        return {
          resources: [
            { uri: "webapi://retrieve/accounts/{id}", name: "webapi-retrieve-account", title: "Retrieve Account" },
            { uri: "webapi://retrieveMultiple/contacts", name: "webapi-list-contacts", title: "List Contacts" },
            { uri: "webapi://create/accounts", name: "webapi-create-account", title: "Create Account" },
            { uri: "webapi://update/accounts/{id}", name: "webapi-update-account", title: "Update Account" },
            { uri: "webapi://delete/accounts/{id}", name: "webapi-delete-account", title: "Delete Account" }
          ]
        };
      },
      complete: {
        operation: (value) => {
          const operations = ["retrieve", "retrieveMultiple", "create", "update", "delete", "associate", "disassociate", "callAction", "callFunction"];
          return operations.filter(op => op.toLowerCase().startsWith(value.toLowerCase()));
        },
        entitySetName: (value) => {
          // Common Dataverse entities for completion
          const entities = ["accounts", "contacts", "opportunities", "leads", "systemusers", "teams", "businessunits"];
          return entities.filter(e => e.toLowerCase().startsWith(value.toLowerCase()));
        }
      }
    }),
    {
      title: "Dataverse WebAPI Call Generator",
      description: "Generate HTTP requests, curl commands, and JavaScript examples for Dataverse WebAPI operations"
    },
    async (uri, params) => {
      // Debug logging to see what we're receiving
      console.log('WebAPI Resource called with URI:', uri.href);
      console.log('WebAPI Resource params:', JSON.stringify(params, null, 2));
      
      // Extract parameters from the URI template
      const { operation, entitySetName, entityId } = params || {};
      
      // Convert arrays to strings (take first element)
      const opStr = Array.isArray(operation) ? operation[0] : operation;
      const entityStr = Array.isArray(entitySetName) ? entitySetName[0] : entitySetName;
      const idStr = Array.isArray(entityId) ? entityId[0] : entityId;
      
      // If parameters are not being extracted properly, try manual parsing
      if (!opStr || !entityStr) {
        const uriParts = uri.href.replace('webapi://', '').split('/');
        const manualOp = uriParts[0];
        const manualEntity = uriParts[1];
        const manualId = uriParts[2];
        
        console.log('Manual parsing:', { manualOp, manualEntity, manualId });
        
        const codeExamples = generateWebAPIExamples(client, manualOp, manualEntity, manualId);
        return {
          contents: [{
            uri: uri.href,
            text: codeExamples,
            mimeType: "text/plain"
          }]
        };
      }
      
      const codeExamples = generateWebAPIExamples(client, opStr, entityStr, idStr);
      return {
        contents: [{
          uri: uri.href,
          text: codeExamples,
          mimeType: "text/plain"
        }]
      };
    }
  );

  // Register WebAPI examples resource with more specific templates
  server.registerResource(
    "webapi-examples",
    new ResourceTemplate("webapi-examples://{operation}/{entitySetName?}", {
      list: async () => {
        // Return example URIs for different operations
        return {
          resources: [
            { uri: "webapi-examples://retrieve/accounts", name: "webapi-examples-retrieve", title: "Account Retrieve Examples" },
            { uri: "webapi-examples://retrieveMultiple/contacts", name: "webapi-examples-list", title: "Contact List Examples" },
            { uri: "webapi-examples://create/accounts", name: "webapi-examples-create", title: "Account Creation Examples" },
            { uri: "webapi-examples://update/contacts", name: "webapi-examples-update", title: "Contact Update Examples" },
            { uri: "webapi-examples://delete/accounts", name: "webapi-examples-delete", title: "Account Deletion Examples" }
          ]
        };
      },
      complete: {
        operation: (value) => {
          const operations = ["retrieve", "retrieveMultiple", "create", "update", "delete"];
          return operations.filter(op => op.toLowerCase().startsWith(value.toLowerCase()));
        }
      }
    }),
    {
      title: "Dataverse WebAPI Examples",
      description: "Common WebAPI operation examples with best practices"
    },
    async (uri, params) => {
      // Extract parameters from the URI template
      const { operation, entitySetName } = params || {};
      
      // Convert arrays to strings (take first element)
      const opStr = Array.isArray(operation) ? operation[0] : operation;
      const entityStr = Array.isArray(entitySetName) ? entitySetName[0] : entitySetName;
      
      let examples = `# Dataverse WebAPI Examples - ${opStr}\n\n`;
      
      switch (opStr) {
        case 'retrieve':
          examples += `## Retrieve Single Record\n\n`;
          examples += generateWebAPIExamples(client, 'retrieve', entityStr || 'accounts', '{record-id}', {
            select: ['name', 'emailaddress1'],
            expand: 'primarycontactid($select=fullname,emailaddress1)'
          });
          break;
          
        case 'retrieveMultiple':
          examples += `## Retrieve Multiple Records\n\n`;
          examples += generateWebAPIExamples(client, 'retrieveMultiple', entityStr || 'accounts', undefined, {
            select: ['name', 'emailaddress1', 'telephone1'],
            filter: 'statecode eq 0',
            orderby: 'name asc',
            top: 10
          });
          break;
          
        case 'create':
          examples += `## Create New Record\n\n`;
          examples += generateWebAPIExamples(client, 'create', entityStr || 'accounts', undefined, {
            data: {
              name: 'Sample Account',
              emailaddress1: 'sample@example.com',
              telephone1: '555-0123'
            },
            prefer: ['return=representation']
          });
          break;
          
        case 'update':
          examples += `## Update Existing Record\n\n`;
          examples += generateWebAPIExamples(client, 'update', entityStr || 'accounts', '{record-id}', {
            data: {
              name: 'Updated Account Name',
              emailaddress1: 'updated@example.com'
            },
            ifMatch: '*'
          });
          break;
          
        case 'delete':
          examples += `## Delete Record\n\n`;
          examples += generateWebAPIExamples(client, 'delete', entityStr || 'accounts', '{record-id}');
          break;
          
        default:
          examples += `## ${opStr} Operation\n\n`;
          examples += generateWebAPIExamples(client, opStr, entityStr);
      }
      
      return {
        contents: [{
          uri: uri.href,
          text: examples,
          mimeType: "text/markdown"
        }]
      };
    }
  );
}