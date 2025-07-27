const { spawn } = require('child_process');
const path = require('path');

// Test the WebAPI call generator tool
async function testWebAPITool() {
  console.log('Testing WebAPI Call Generator Tool...\n');

  const serverPath = path.join(__dirname, '..', 'build', 'index.js');
  
  // Test cases
  const testCases = [
    {
      name: 'Retrieve Single Record',
      request: {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'generate_webapi_call',
          arguments: {
            operation: 'retrieve',
            entitySetName: 'accounts',
            entityId: '12345678-1234-1234-1234-123456789012',
            select: ['name', 'emailaddress1', 'telephone1'],
            expand: 'primarycontactid($select=fullname,emailaddress1)'
          }
        }
      }
    },
    {
      name: 'Retrieve Multiple Records',
      request: {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'generate_webapi_call',
          arguments: {
            operation: 'retrieveMultiple',
            entitySetName: 'contacts',
            select: ['fullname', 'emailaddress1'],
            filter: "statecode eq 0 and contains(fullname,'John')",
            orderby: 'fullname asc',
            top: 10
          }
        }
      }
    },
    {
      name: 'Create Record',
      request: {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'generate_webapi_call',
          arguments: {
            operation: 'create',
            entitySetName: 'accounts',
            data: {
              name: 'Test Account',
              emailaddress1: 'test@example.com',
              telephone1: '555-1234'
            },
            prefer: ['return=representation']
          }
        }
      }
    },
    {
      name: 'Update Record',
      request: {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: {
          name: 'generate_webapi_call',
          arguments: {
            operation: 'update',
            entitySetName: 'accounts',
            entityId: '12345678-1234-1234-1234-123456789012',
            data: {
              name: 'Updated Account Name',
              telephone1: '555-5678'
            },
            ifMatch: '*'
          }
        }
      }
    },
    {
      name: 'Associate Records',
      request: {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: {
          name: 'generate_webapi_call',
          arguments: {
            operation: 'associate',
            entitySetName: 'accounts',
            entityId: '12345678-1234-1234-1234-123456789012',
            relationshipName: 'account_primary_contact',
            relatedEntitySetName: 'contacts',
            relatedEntityId: '87654321-4321-4321-4321-210987654321'
          }
        }
      }
    },
    {
      name: 'Call Action',
      request: {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: {
          name: 'generate_webapi_call',
          arguments: {
            operation: 'callAction',
            actionOrFunctionName: 'WinOpportunity',
            entitySetName: 'opportunities',
            entityId: '11111111-1111-1111-1111-111111111111',
            parameters: {
              Status: 3,
              Subject: 'Won Opportunity'
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
        console.log('Success! Generated WebAPI call:');
        console.log(result.result.content[0].text);
      }
    } catch (error) {
      console.error('Test failed:', error.message);
    }
    
    console.log('\n' + '='.repeat(50));
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
testWebAPITool().catch(console.error);