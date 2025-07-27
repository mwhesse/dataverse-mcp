const { spawn } = require('child_process');
const path = require('path');

// Test the PowerPages WebAPI call generator tool
async function testPowerPagesWebAPITool() {
  console.log('Testing PowerPages WebAPI Call Generator Tool...\n');

  const serverPath = path.join(__dirname, '..', 'build', 'index.js');
  
  // Test cases
  const testCases = [
    {
      name: 'Retrieve Single Credit Card Record',
      request: {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'generate_powerpages_webapi_call',
          arguments: {
            operation: 'retrieve',
            logicalEntityName: 'cr7ae_creditcardses',
            entityId: '12345678-1234-1234-1234-123456789012',
            select: ['cr7ae_name', 'cr7ae_type', 'cr7ae_features'],
            baseUrl: 'https://contoso.powerappsportals.com'
          }
        }
      }
    },
    {
      name: 'Retrieve Multiple Credit Cards',
      request: {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'generate_powerpages_webapi_call',
          arguments: {
            operation: 'retrieveMultiple',
            logicalEntityName: 'cr7ae_creditcardses',
            select: ['cr7ae_name', 'cr7ae_type', 'cr7ae_category'],
            filter: "cr7ae_type eq 'Premium'",
            orderby: 'cr7ae_name asc',
            top: 10,
            baseUrl: 'https://contoso.powerappsportals.com',
            includeAuthContext: true
          }
        }
      }
    },
    {
      name: 'Create New Credit Card',
      request: {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'generate_powerpages_webapi_call',
          arguments: {
            operation: 'create',
            logicalEntityName: 'cr7ae_creditcardses',
            data: {
              cr7ae_name: 'New Premium Card',
              cr7ae_type: 'Premium',
              cr7ae_features: 'Cashback, Travel Insurance',
              cr7ae_category: 'Business'
            },
            baseUrl: 'https://contoso.powerappsportals.com',
            requestVerificationToken: true
          }
        }
      }
    },
    {
      name: 'Update Credit Card',
      request: {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: {
          name: 'generate_powerpages_webapi_call',
          arguments: {
            operation: 'update',
            logicalEntityName: 'cr7ae_creditcardses',
            entityId: '12345678-1234-1234-1234-123456789012',
            data: {
              cr7ae_name: 'Updated Premium Card',
              cr7ae_features: 'Enhanced Cashback, Premium Travel Insurance'
            },
            baseUrl: 'https://contoso.powerappsportals.com',
            requestVerificationToken: true
          }
        }
      }
    },
    {
      name: 'Delete Credit Card',
      request: {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: {
          name: 'generate_powerpages_webapi_call',
          arguments: {
            operation: 'delete',
            logicalEntityName: 'cr7ae_creditcardses',
            entityId: '12345678-1234-1234-1234-123456789012',
            baseUrl: 'https://contoso.powerappsportals.com',
            requestVerificationToken: true
          }
        }
      }
    },
    {
      name: 'Retrieve Contacts with Custom Headers',
      request: {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: {
          name: 'generate_powerpages_webapi_call',
          arguments: {
            operation: 'retrieveMultiple',
            logicalEntityName: 'contacts',
            select: ['fullname', 'emailaddress1', 'telephone1'],
            filter: "contains(fullname,'John')",
            top: 5,
            baseUrl: 'https://contoso.powerappsportals.com',
            customHeaders: {
              'X-Custom-Header': 'PowerPages-API',
              'X-Client-Version': '1.0'
            }
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
        console.log('Success! Generated PowerPages WebAPI call:');
        console.log(result.result.content[0].text);
      }
    } catch (error) {
      console.error('Test failed:', error.message);
    }
    
    console.log('\n' + '='.repeat(60));
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
testPowerPagesWebAPITool().catch(console.error);