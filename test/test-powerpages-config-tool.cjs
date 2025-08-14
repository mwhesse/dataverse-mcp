const { spawn } = require('child_process');
const path = require('path');

// Test the PowerPages configuration management tool
async function testPowerPagesConfigTool() {
  console.log('Testing PowerPages Configuration Management Tool...\n');

  const serverPath = path.join(__dirname, '..', 'build', 'index.js');
  
  // Test cases
  const testCases = [
    {
      name: 'Check Configuration Status for Credit Cards Table',
      request: {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'manage_powerpages_webapi_config',
          arguments: {
            operation: 'check_config_status',
            tableName: 'cr7ae_creditcardses',
            projectPath: '/Users/martin/code/dataverse-mcp-dotnet'
          }
        }
      }
    },
    {
      name: 'List Current WebAPI Configurations',
      request: {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'manage_powerpages_webapi_config',
          arguments: {
            operation: 'list_webapi_configs',
            projectPath: '/Users/martin/code/dataverse-mcp-dotnet'
          }
        }
      }
    },
    {
      name: 'Add WebAPI Configuration for Contacts Table',
      request: {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'manage_powerpages_webapi_config',
          arguments: {
            operation: 'add_webapi_config',
            tableName: 'contacts',
            fields: 'fullname,emailaddress1,telephone1',
            projectPath: '/Users/martin/code/dataverse-mcp-dotnet'
          }
        }
      }
    },
    {
      name: 'Add Table Permission for Contacts',
      request: {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: {
          name: 'manage_powerpages_webapi_config',
          arguments: {
            operation: 'add_table_permission',
            tableName: 'contacts',
            permissionName: 'Contacts Read Permission',
            webRoleName: 'Authenticated Users',
            accessType: 'Global',
            privileges: ['Read'],
            projectPath: '/Users/martin/code/dataverse-mcp-dotnet'
          }
        }
      }
    },
    {
      name: 'List Table Permissions',
      request: {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: {
          name: 'manage_powerpages_webapi_config',
          arguments: {
            operation: 'list_table_permissions',
            projectPath: '/Users/martin/code/dataverse-mcp-dotnet'
          }
        }
      }
    },
    {
      name: 'Add WebAPI Configuration for Custom Table',
      request: {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: {
          name: 'manage_powerpages_webapi_config',
          arguments: {
            operation: 'add_webapi_config',
            tableName: 'xyz_projects',
            fields: '*',
            projectPath: '/Users/martin/code/dataverse-mcp-dotnet'
          }
        }
      }
    },
    {
      name: 'Add Table Permission with Multiple Privileges',
      request: {
        jsonrpc: '2.0',
        id: 7,
        method: 'tools/call',
        params: {
          name: 'manage_powerpages_webapi_config',
          arguments: {
            operation: 'add_table_permission',
            tableName: 'xyz_projects',
            permissionName: 'Projects Full Access',
            webRoleName: 'Authenticated Users',
            accessType: 'Global',
            privileges: ['Read', 'Write', 'Create', 'Delete'],
            projectPath: '/Users/martin/code/dataverse-mcp-dotnet'
          }
        }
      }
    },
    {
      name: 'Check Configuration Status After Changes',
      request: {
        jsonrpc: '2.0',
        id: 8,
        method: 'tools/call',
        params: {
          name: 'manage_powerpages_webapi_config',
          arguments: {
            operation: 'check_config_status',
            tableName: 'contacts',
            projectPath: '/Users/martin/code/dataverse-mcp-dotnet'
          }
        }
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n=== ${testCase.name} ===`);
    
    try {
      const result = await runMCPRequest(serverPath, testCase.request);
      
      if (result.error) {
        console.error('Error:', result.error);
      } else {
        console.log('Success! Configuration result:');
        console.log(result.result.content[0].text);
      }
    } catch (error) {
      console.error('Test failed:', error.message);
    }
    
    console.log('\n' + '='.repeat(70));
  }
}

function runMCPRequest(serverPath, request) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        DATAVERSE_URL: 'https://example.crm.dynamics.com',
        DATAVERSE_CLIENT_ID: 'test-client-id',
        DATAVERSE_CLIENT_SECRET: 'test-client-secret',
        DATAVERSE_TENANT_ID: 'test-tenant-id'
      }
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}. Stderr: ${stderr}`));
        return;
      }

      try {
        // Parse the JSON-RPC response
        const lines = stdout.trim().split('\n');
        const responseLine = lines.find(line => {
          try {
            const parsed = JSON.parse(line);
            return parsed.id === request.id;
          } catch {
            return false;
          }
        });

        if (responseLine) {
          resolve(JSON.parse(responseLine));
        } else {
          reject(new Error('No matching response found'));
        }
      } catch (error) {
        reject(new Error(`Failed to parse response: ${error.message}`));
      }
    });

    // Send the request
    child.stdin.write(JSON.stringify(request) + '\n');
    child.stdin.end();
  });
}

// Run the test
testPowerPagesConfigTool().catch(console.error);