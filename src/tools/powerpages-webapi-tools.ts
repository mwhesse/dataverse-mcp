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

export function generatePowerPagesWebAPICallTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "generate_powerpages_webapi_call",
    {
      operation: z.enum([
        "retrieve", "retrieveMultiple", "create", "update", "delete"
      ]).describe("Type of operation to perform"),
      
      logicalEntityName: z.string().describe("Logical entity name (e.g., 'cr7ae_creditcardses', 'contacts')"),
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
    },
    async (params) => {
      try {
        const baseUrl = params.baseUrl || 'https://yoursite.powerappsportals.com';
        
        let method = 'GET';
        let endpoint = '';
        let body: any = undefined;
        
        // Build headers
        const headerOptions: any = {
          customHeaders: params.customHeaders
        };
        
        if (params.requestVerificationToken && (params.operation === 'create' || params.operation === 'update' || params.operation === 'delete')) {
          headerOptions.requestVerificationToken = '{REQUEST_VERIFICATION_TOKEN}';
        }
        
        const headers = generatePowerPagesHeaders(headerOptions);
        
        // Build endpoint based on operation type
        switch (params.operation) {
          case 'retrieve':
            if (!params.entityId) {
              throw new Error('entityId is required for retrieve operation');
            }
            method = 'GET';
            endpoint = `/_api/${params.logicalEntityName}(${params.entityId})`;
            
            const retrieveQuery = buildPowerPagesODataQuery({
              select: params.select,
              expand: params.expand
            });
            endpoint += retrieveQuery;
            break;
            
          case 'retrieveMultiple':
            method = 'GET';
            endpoint = `/_api/${params.logicalEntityName}`;
            
            const retrieveMultipleQuery = buildPowerPagesODataQuery({
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
            if (!params.data) {
              throw new Error('data is required for create operation');
            }
            method = 'POST';
            endpoint = `/_api/${params.logicalEntityName}`;
            body = params.data;
            break;
            
          case 'update':
            if (!params.entityId || !params.data) {
              throw new Error('entityId and data are required for update operation');
            }
            method = 'PATCH';
            endpoint = `/_api/${params.logicalEntityName}(${params.entityId})`;
            body = params.data;
            break;
            
          case 'delete':
            if (!params.entityId) {
              throw new Error('entityId is required for delete operation');
            }
            method = 'DELETE';
            endpoint = `/_api/${params.logicalEntityName}(${params.entityId})`;
            break;
            
          default:
            throw new Error(`Unsupported operation: ${params.operation}`);
        }
        
        const webApiCall = formatPowerPagesWebAPICall(baseUrl, method, endpoint, headers, body);
        
        // Additional information
        let additionalInfo = '\n\n--- Additional Information ---\n';
        additionalInfo += `Operation Type: ${params.operation}\n`;
        additionalInfo += `Entity: ${params.logicalEntityName}\n`;
        additionalInfo += `PowerPages WebAPI Format: /_api/[logicalEntityName]\n`;
        
        if (params.entityId) {
          additionalInfo += `Entity ID: ${params.entityId}\n`;
        }
        
        // Include JavaScript fetch example for PowerPages
        let fetchExample = `// PowerPages WebAPI Call\n`;
        fetchExample += `const fetchData = async () => {\n`;
        
        if (params.requestVerificationToken && (params.operation === 'create' || params.operation === 'update' || params.operation === 'delete')) {
          fetchExample += `  // Get the request verification token\n`;
          fetchExample += `  const token = document.querySelector('input[name="__RequestVerificationToken"]')?.value;\n\n`;
        }
        
        fetchExample += `  try {\n`;
        fetchExample += `    const response = await fetch('${endpoint}', {\n`;
        fetchExample += `      method: '${method}',\n`;
        
        // Build headers for fetch example
        const fetchHeaders: Record<string, string> = { ...headers };
        if (params.requestVerificationToken && (params.operation === 'create' || params.operation === 'update' || params.operation === 'delete')) {
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
        
        if (params.operation === 'retrieveMultiple') {
          fetchExample += `    const data = await response.json();\n`;
          fetchExample += `    const records = data.value; // Array of records\n`;
          fetchExample += `    console.log('Records:', records);\n`;
          fetchExample += `    return records;\n`;
        } else if (params.operation === 'retrieve') {
          fetchExample += `    const record = await response.json();\n`;
          fetchExample += `    console.log('Record:', record);\n`;
          fetchExample += `    return record;\n`;
        } else if (params.operation === 'create') {
          fetchExample += `    const createdRecord = await response.json();\n`;
          fetchExample += `    console.log('Created record:', createdRecord);\n`;
          fetchExample += `    return createdRecord;\n`;
        } else if (params.operation === 'update') {
          fetchExample += `    console.log('Record updated successfully');\n`;
          fetchExample += `    return true;\n`;
        } else if (params.operation === 'delete') {
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
        if (params.operation === 'retrieveMultiple') {
          let reactExample = `// React Hook Example\n`;
          reactExample += `import React, { useState, useEffect } from 'react';\n\n`;
          reactExample += `const ${params.logicalEntityName.charAt(0).toUpperCase() + params.logicalEntityName.slice(1)}List = () => {\n`;
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
          reactExample += `      <h2>${params.logicalEntityName} Records</h2>\n`;
          reactExample += `      {records.map((record, index) => (\n`;
          reactExample += `        <div key={record.${params.logicalEntityName}id || index}>\n`;
          reactExample += `          {/* Render record properties */}\n`;
          reactExample += `          <pre>{JSON.stringify(record, null, 2)}</pre>\n`;
          reactExample += `        </div>\n`;
          reactExample += `      ))}\n`;
          reactExample += `    </div>\n`;
          reactExample += `  );\n`;
          reactExample += `};\n\n`;
          reactExample += `export default ${params.logicalEntityName.charAt(0).toUpperCase() + params.logicalEntityName.slice(1)}List;`;
          
          additionalInfo += `\nReact Component Example:\n${reactExample}\n`;
        }
        
        // Include authentication context information
        if (params.includeAuthContext) {
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
              text: `Error generating PowerPages WebAPI call: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}