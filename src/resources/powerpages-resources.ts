import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
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

// Helper function to generate headers for PowerPages
function generatePowerPagesHeaders(options: {
  contentType?: string;
  accept?: string;
  requestVerificationToken?: string;
  customHeaders?: Record<string, string>;
}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': options.contentType || 'application/json',
    'Accept': options.accept || 'application/json'
  };
  
  if (options.requestVerificationToken) {
    headers['__RequestVerificationToken'] = options.requestVerificationToken;
  }
  
  if (options.customHeaders) {
    Object.assign(headers, options.customHeaders);
  }
  
  return headers;
}

// Helper function to ensure PowerPages entity name has proper suffix
function formatPowerPagesEntityName(logicalEntityName: string): string {
  return logicalEntityName.endsWith('s') ? logicalEntityName : `${logicalEntityName}s`;
}

// Helper function to format the complete PowerPages WebAPI call
function formatPowerPagesWebAPICall(
  baseUrl: string,
  method: string,
  endpoint: string,
  headers: Record<string, string>,
  body?: any
): string {
  const fullUrl = `${baseUrl}${endpoint}`;
  
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

// Generate PowerPages WebAPI code examples
function generatePowerPagesExamples(
  operation: string,
  logicalEntityName?: string,
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
    baseUrl?: string;
    requestVerificationToken?: boolean;
    includeAuthContext?: boolean;
    customHeaders?: Record<string, string>;
  } = {}
): string {
  try {
    const baseUrl = options.baseUrl || 'https://yoursite.powerappsportals.com';
    
    let method = 'GET';
    let endpoint = '';
    let body: any = undefined;
    
    // Build headers
    const headerOptions: any = {
      customHeaders: options.customHeaders
    };
    
    if (options.requestVerificationToken && (operation === 'create' || operation === 'update' || operation === 'delete')) {
      headerOptions.requestVerificationToken = '{REQUEST_VERIFICATION_TOKEN}';
    }
    
    const headers = generatePowerPagesHeaders(headerOptions);
    
    // Build endpoint based on operation type
    const formattedEntityName = logicalEntityName ? formatPowerPagesEntityName(logicalEntityName) : 'entities';
    
    switch (operation) {
      case 'retrieve':
        if (!entityId) {
          throw new Error('entityId is required for retrieve operation');
        }
        method = 'GET';
        endpoint = `/_api/${formattedEntityName}(${entityId})`;
        
        const retrieveQuery = buildPowerPagesODataQuery({
          select: options.select,
          expand: options.expand
        });
        endpoint += retrieveQuery;
        break;
        
      case 'retrieveMultiple':
        method = 'GET';
        endpoint = `/_api/${formattedEntityName}`;
        
        const retrieveMultipleQuery = buildPowerPagesODataQuery({
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
        if (!options.data) {
          throw new Error('data is required for create operation');
        }
        method = 'POST';
        endpoint = `/_api/${formattedEntityName}`;
        body = options.data;
        break;
        
      case 'update':
        if (!entityId || !options.data) {
          throw new Error('entityId and data are required for update operation');
        }
        method = 'PATCH';
        endpoint = `/_api/${formattedEntityName}(${entityId})`;
        body = options.data;
        break;
        
      case 'delete':
        if (!entityId) {
          throw new Error('entityId is required for delete operation');
        }
        method = 'DELETE';
        endpoint = `/_api/${formattedEntityName}(${entityId})`;
        break;
        
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
    
    const webApiCall = formatPowerPagesWebAPICall(baseUrl, method, endpoint, headers, body);
    
    // Additional information
    let additionalInfo = '\n\n--- Additional Information ---\n';
    additionalInfo += `Operation Type: ${operation}\n`;
    if (logicalEntityName) {
      additionalInfo += `Entity: ${logicalEntityName}\n`;
      additionalInfo += `Formatted Entity Name: ${formattedEntityName}\n`;
    }
    additionalInfo += `PowerPages WebAPI Format: /_api/[logicalEntityName]s (note: 's' suffix required)\n`;
    
    if (entityId) {
      additionalInfo += `Entity ID: ${entityId}\n`;
    }
    
    // Include JavaScript fetch example for PowerPages
    let fetchExample = `// PowerPages WebAPI Call\n`;
    fetchExample += `const fetchData = async () => {\n`;
    
    if (options.requestVerificationToken && (operation === 'create' || operation === 'update' || operation === 'delete')) {
      fetchExample += `  // Get the request verification token\n`;
      fetchExample += `  const token = document.querySelector('input[name="__RequestVerificationToken"]')?.value;\n\n`;
    }
    
    fetchExample += `  try {\n`;
    fetchExample += `    const response = await fetch('${endpoint}', {\n`;
    fetchExample += `      method: '${method}',\n`;
    
    // Build headers for fetch example
    const fetchHeaders: Record<string, string> = { ...headers };
    if (options.requestVerificationToken && (operation === 'create' || operation === 'update' || operation === 'delete')) {
      fetchHeaders['__RequestVerificationToken'] = '${token}';
    }
    
    fetchExample += `      headers: ${JSON.stringify(fetchHeaders, null, 8).replace(/"/g, "'").replace(/'(\$\{[^}]+\})'/g, '$1')},\n`;
    
    if (body) {
      fetchExample += `      body: JSON.stringify(${JSON.stringify(body, null, 8)})\n`;
    }
    
    fetchExample += `    });\n\n`;
    fetchExample += `    if (!response.ok) {\n`;
    fetchExample += `      throw new Error(\`HTTP error! status: \${response.status}\`);\n`;
    fetchExample += `    }\n\n`;
    
    if (operation === 'retrieveMultiple') {
      fetchExample += `    const data = await response.json();\n`;
      fetchExample += `    const records = data.value; // Array of records\n`;
      fetchExample += `    console.log('Records:', records);\n`;
      fetchExample += `    return records;\n`;
    } else if (operation === 'retrieve') {
      fetchExample += `    const record = await response.json();\n`;
      fetchExample += `    console.log('Record:', record);\n`;
      fetchExample += `    return record;\n`;
    } else if (operation === 'create') {
      fetchExample += `    const createdRecord = await response.json();\n`;
      fetchExample += `    console.log('Created record:', createdRecord);\n`;
      fetchExample += `    return createdRecord;\n`;
    } else if (operation === 'update') {
      fetchExample += `    console.log('Record updated successfully');\n`;
      fetchExample += `    return true;\n`;
    } else if (operation === 'delete') {
      fetchExample += `    console.log('Record deleted successfully');\n`;
      fetchExample += `    return true;\n`;
    }
    
    fetchExample += `  } catch (error) {\n`;
    fetchExample += `    console.error('Error:', error);\n`;
    fetchExample += `    throw error;\n`;
    fetchExample += `  }\n`;
    fetchExample += `};\n\n`;
    fetchExample += `// Call the function\n`;
    fetchExample += `fetchData();`;
    
    additionalInfo += `\nPowerPages JavaScript Example:\n${fetchExample}\n`;
    
    // Include React example if applicable
    if (operation === 'retrieveMultiple' && logicalEntityName) {
      let reactExample = `// React Hook Example\n`;
      reactExample += `import React, { useState, useEffect } from 'react';\n\n`;
      reactExample += `const ${logicalEntityName.charAt(0).toUpperCase() + logicalEntityName.slice(1)}List = () => {\n`;
      reactExample += `  const [records, setRecords] = useState([]);\n`;
      reactExample += `  const [loading, setLoading] = useState(true);\n\n`;
      reactExample += `  useEffect(() => {\n`;
      reactExample += `    const fetchRecords = async () => {\n`;
      reactExample += `      try {\n`;
      reactExample += `        const response = await fetch('${endpoint}');\n`;
      reactExample += `        const data = await response.json();\n`;
      reactExample += `        setRecords(data.value);\n`;
      reactExample += `      } catch (error) {\n`;
      reactExample += `        console.error('Error fetching records:', error);\n`;
      reactExample += `      } finally {\n`;
      reactExample += `        setLoading(false);\n`;
      reactExample += `      }\n`;
      reactExample += `    };\n\n`;
      reactExample += `    fetchRecords();\n`;
      reactExample += `  }, []);\n\n`;
      reactExample += `  if (loading) return <div>Loading...</div>;\n\n`;
      reactExample += `  return (\n`;
      reactExample += `    <div>\n`;
      reactExample += `      <h2>${logicalEntityName} Records</h2>\n`;
      reactExample += `      {records.map((record, index) => (\n`;
      reactExample += `        <div key={record.${logicalEntityName}id || index}>\n`;
      reactExample += `          {/* Render record properties */}\n`;
      reactExample += `          <pre>{JSON.stringify(record, null, 2)}</pre>\n`;
      reactExample += `        </div>\n`;
      reactExample += `      ))}\n`;
      reactExample += `    </div>\n`;
      reactExample += `  );\n`;
      reactExample += `};\n\n`;
      reactExample += `export default ${logicalEntityName.charAt(0).toUpperCase() + logicalEntityName.slice(1)}List;`;
      
      additionalInfo += `\nReact Component Example:\n${reactExample}\n`;
    }
    
    // Include authentication context information
    if (options.includeAuthContext) {
      let authInfo = `\n--- Authentication Context ---\n`;
      authInfo += `// Access user information in PowerPages\n`;
      authInfo += `const user = window["Microsoft"]?.Dynamic365?.Portal?.User;\n`;
      authInfo += `const userName = user?.userName || "";\n`;
      authInfo += `const firstName = user?.firstName || "";\n`;
      authInfo += `const lastName = user?.lastName || "";\n`;
      authInfo += `const isAuthenticated = userName !== "";\n\n`;
      authInfo += `// Get authentication token (if needed)\n`;
      authInfo += `const getToken = async () => {\n`;
      authInfo += `  try {\n`;
      authInfo += `    const token = await window.shell.getTokenDeferred();\n`;
      authInfo += `    return token;\n`;
      authInfo += `  } catch (error) {\n`;
      authInfo += `    console.error('Error fetching token:', error);\n`;
      authInfo += `    return null;\n`;
      authInfo += `  }\n`;
      authInfo += `};\n`;
      
      additionalInfo += authInfo;
    }
    
    return `${webApiCall}${additionalInfo}`;
  } catch (error) {
    return `Error generating PowerPages WebAPI call: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

export function registerPowerPagesResources(server: McpServer, client: DataverseClient) {
  // Register PowerPages WebAPI code generation resource
  server.registerResource(
    "powerpages-webapi",
    new ResourceTemplate("powerpages://{operation}/{entityName?}/{entityId?}", {
      list: async () => {
        // Return some example URIs for discovery
        return {
          resources: [
            { uri: "powerpages://retrieve/contacts/{id}", name: "powerpages-retrieve-contact", title: "Retrieve Contact" },
            { uri: "powerpages://retrieveMultiple/contacts", name: "powerpages-list-contacts", title: "List Contacts" },
            { uri: "powerpages://create/contacts", name: "powerpages-create-contact", title: "Create Contact" },
            { uri: "powerpages://update/contacts/{id}", name: "powerpages-update-contact", title: "Update Contact" },
            { uri: "powerpages://delete/contacts/{id}", name: "powerpages-delete-contact", title: "Delete Contact" }
          ]
        };
      },
      complete: {
        operation: (value) => {
          const operations = ["retrieve", "retrieveMultiple", "create", "update", "delete"];
          return operations.filter(op => op.toLowerCase().startsWith(value.toLowerCase()));
        },
        entityName: (value) => {
          // Common custom entity patterns for PowerPages
          const entities = ["contacts", "accounts", "cr123_customentities", "new_customtables"];
          return entities.filter(e => e.toLowerCase().startsWith(value.toLowerCase()));
        }
      }
    }),
    {
      title: "PowerPages WebAPI Call Generator",
      description: "Generate PowerPages-specific API calls, JavaScript examples, and React components"
    },
    async (uri, params) => {
      // Debug logging to see what we're receiving
      console.log('PowerPages Resource called with URI:', uri.href);
      console.log('PowerPages Resource params:', JSON.stringify(params, null, 2));
      
      // Extract parameters from the URI template
      const { operation, entityName, entityId } = params || {};
      
      // Convert arrays to strings (take first element)
      const opStr = Array.isArray(operation) ? operation[0] : operation;
      const entityStr = Array.isArray(entityName) ? entityName[0] : entityName;
      const idStr = Array.isArray(entityId) ? entityId[0] : entityId;
      
      // If parameters are not being extracted properly, try manual parsing
      if (!opStr || !entityStr) {
        const uriParts = uri.href.replace('powerpages://', '').split('/');
        const manualOp = uriParts[0];
        const manualEntity = uriParts[1];
        const manualId = uriParts[2];
        
        console.log('PowerPages Manual parsing:', { manualOp, manualEntity, manualId });
        
        const codeExamples = generatePowerPagesExamples(manualOp, manualEntity, manualId);
        return {
          contents: [{
            uri: uri.href,
            text: codeExamples,
            mimeType: "text/plain"
          }]
        };
      }
      
      const codeExamples = generatePowerPagesExamples(opStr, entityStr, idStr);
      return {
        contents: [{
          uri: uri.href,
          text: codeExamples,
          mimeType: "text/plain"
        }]
      };
    }
  );

  // Register PowerPages examples resource with common patterns
  server.registerResource(
    "powerpages-examples",
    new ResourceTemplate("powerpages-examples://{operation}/{entityName?}", {
      list: async () => {
        // Return example URIs for different operations
        return {
          resources: [
            { uri: "powerpages-examples://retrieve/contacts", name: "powerpages-examples-retrieve", title: "Contact Retrieve Examples" },
            { uri: "powerpages-examples://retrieveMultiple/contacts", name: "powerpages-examples-list", title: "Contact List Examples" },
            { uri: "powerpages-examples://create/contacts", name: "powerpages-examples-create", title: "Contact Creation Examples" },
            { uri: "powerpages-examples://update/contacts", name: "powerpages-examples-update", title: "Contact Update Examples" },
            { uri: "powerpages-examples://delete/contacts", name: "powerpages-examples-delete", title: "Contact Deletion Examples" }
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
      title: "PowerPages WebAPI Examples",
      description: "Common PowerPages WebAPI patterns with authentication and React components"
    },
    async (uri, params) => {
      // Extract parameters from the URI template
      const { operation, entityName } = params || {};
      
      // Convert arrays to strings (take first element)
      const opStr = Array.isArray(operation) ? operation[0] : operation;
      const entityStr = Array.isArray(entityName) ? entityName[0] : entityName;
      
      let examples = `# PowerPages WebAPI Examples - ${opStr}\n\n`;
      
      switch (opStr) {
        case 'retrieve':
          examples += `## Retrieve Single Record from PowerPages\n\n`;
          examples += generatePowerPagesExamples('retrieve', entityStr || 'contacts', '{record-id}', {
            select: ['fullname', 'emailaddress1'],
            requestVerificationToken: false,
            includeAuthContext: true
          });
          break;
          
        case 'retrieveMultiple':
          examples += `## Retrieve Multiple Records from PowerPages\n\n`;
          examples += generatePowerPagesExamples('retrieveMultiple', entityStr || 'contacts', undefined, {
            select: ['fullname', 'emailaddress1', 'telephone1'],
            filter: 'statecode eq 0',
            orderby: 'fullname asc',
            top: 10,
            includeAuthContext: true
          });
          break;
          
        case 'create':
          examples += `## Create New Record in PowerPages\n\n`;
          examples += generatePowerPagesExamples('create', entityStr || 'contacts', undefined, {
            data: {
              fullname: 'John Doe',
              emailaddress1: 'john@example.com',
              telephone1: '555-0123'
            },
            requestVerificationToken: true,
            includeAuthContext: true
          });
          break;
          
        case 'update':
          examples += `## Update Record in PowerPages\n\n`;
          examples += generatePowerPagesExamples('update', entityStr || 'contacts', '{record-id}', {
            data: {
              fullname: 'John Updated',
              emailaddress1: 'john.updated@example.com'
            },
            requestVerificationToken: true,
            includeAuthContext: true
          });
          break;
          
        case 'delete':
          examples += `## Delete Record in PowerPages\n\n`;
          examples += generatePowerPagesExamples('delete', entityStr || 'contacts', '{record-id}', {
            requestVerificationToken: true,
            includeAuthContext: true
          });
          break;
          
        default:
          examples += `## ${opStr} Operation in PowerPages\n\n`;
          examples += generatePowerPagesExamples(opStr, entityStr, undefined, {
            includeAuthContext: true
          });
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

  // Register PowerPages authentication patterns resource
  server.registerResource(
    "powerpages-auth",
    "powerpages-auth://patterns",
    {
      title: "PowerPages Authentication Patterns",
      description: "Common authentication and user context patterns for PowerPages"
    },
    async (uri) => {
      const authPatterns = `# PowerPages Authentication Patterns

## User Context Access

\`\`\`javascript
// Access current user information
const user = window["Microsoft"]?.Dynamic365?.Portal?.User;
const userName = user?.userName || "";
const firstName = user?.firstName || "";
const lastName = user?.lastName || "";
const emailAddress = user?.emailAddress || "";
const isAuthenticated = userName !== "";

console.log('Current user:', {
  userName,
  firstName,
  lastName,
  emailAddress,
  isAuthenticated
});
\`\`\`

## Request Verification Token

\`\`\`javascript
// Get request verification token for POST operations
const getRequestVerificationToken = () => {
  const tokenInput = document.querySelector('input[name="__RequestVerificationToken"]');
  return tokenInput ? tokenInput.value : null;
};

// Use in fetch requests
const token = getRequestVerificationToken();
if (token) {
  headers['__RequestVerificationToken'] = token;
}
\`\`\`

## Authentication Check Hook (React)

\`\`\`javascript
import { useState, useEffect } from 'react';

const usePortalAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const portalUser = window["Microsoft"]?.Dynamic365?.Portal?.User;
        if (portalUser && portalUser.userName) {
          setUser({
            userName: portalUser.userName,
            firstName: portalUser.firstName,
            lastName: portalUser.lastName,
            emailAddress: portalUser.emailAddress
          });
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return { user, isAuthenticated, loading };
};

export default usePortalAuth;
\`\`\`

## Protected API Call Pattern

\`\`\`javascript
const makeProtectedApiCall = async (endpoint, options = {}) => {
  // Check authentication
  const user = window["Microsoft"]?.Dynamic365?.Portal?.User;
  if (!user || !user.userName) {
    throw new Error('User not authenticated');
  }

  // Get verification token for write operations
  const token = getRequestVerificationToken();
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers
  };

  if (token && ['POST', 'PATCH', 'DELETE'].includes(options.method?.toUpperCase())) {
    headers['__RequestVerificationToken'] = token;
  }

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      if (response.status === 403) {
        throw new Error('Access denied');
      }
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};
\`\`\``;

      return {
        contents: [{
          uri: uri.href,
          text: authPatterns,
          mimeType: "text/markdown"
        }]
      };
    }
  );
}