const { spawn } = require('child_process');
const path = require('path');

// Test the enhanced PowerPages WebAPI tool with schema-aware capabilities and @odata.bind support
async function testPowerPagesWebAPIEnhanced() {
  console.log('🧪 Testing Enhanced PowerPages WebAPI Tool...\n');

  const serverPath = path.join(__dirname, '..', 'build', 'index.js');
  
  // Test cases for enhanced PowerPages WebAPI functionality
  const testCases = [
    {
      name: 'PowerPages Create with Schema-Aware Sample Body',
      request: {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'generate_powerpages_webapi_call',
          arguments: {
            operation: 'create',
            logicalEntityName: 'contact',
            baseUrl: 'https://myportal.powerappsportals.com'
          }
        }
      }
    },
    {
      name: 'PowerPages Create with @odata.bind Relationships',
      request: {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'generate_powerpages_webapi_call',
          arguments: {
            operation: 'create',
            logicalEntityName: 'contact',
            baseUrl: 'https://myportal.powerappsportals.com',
            data: {
              firstname: 'John',
              lastname: 'Doe',
              emailaddress1: 'john.doe@example.com',
              'parentcustomerid@odata.bind': '/_api/accounts(12345678-1234-1234-1234-123456789012)'
            }
          }
        }
      }
    },
    {
      name: 'PowerPages Update with Navigation Property Correction',
      request: {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'generate_powerpages_webapi_call',
          arguments: {
            operation: 'update',
            logicalEntityName: 'contact',
            entityId: '87654321-4321-4321-4321-210987654321',
            baseUrl: 'https://myportal.powerappsportals.com',
            data: {
              firstname: 'Jane',
              // Test payload correction: using lookup attribute name instead of navigation property
              parentcustomerid: 'accounts(11111111-1111-1111-1111-111111111111)'
            }
          }
        }
      }
    },
    {
      name: 'PowerPages Retrieve with Auto-Selected Fields',
      request: {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: {
          name: 'generate_powerpages_webapi_call',
          arguments: {
            operation: 'retrieve',
            logicalEntityName: 'contact',
            entityId: '87654321-4321-4321-4321-210987654321',
            baseUrl: 'https://myportal.powerappsportals.com'
          }
        }
      }
    },
    {
      name: 'PowerPages with Authentication Context',
      request: {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: {
          name: 'generate_powerpages_webapi_call',
          arguments: {
            operation: 'create',
            logicalEntityName: 'contact',
            baseUrl: 'https://myportal.powerappsportals.com',
            requestVerificationToken: true,
            includeAuthContext: true,
            data: {
              firstname: 'Test',
              lastname: 'User'
            }
          }
        }
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`📋 ${testCase.name}`);
    console.log('─'.repeat(50));
    
    try {
      const result = await callMCPServer(serverPath, testCase.request);
      
      if (result.error) {
        console.log('❌ Error:', result.error.message);
        continue;
      }

      const content = result.result?.content?.[0]?.text || 'No content';
      
      // Verify enhanced features
      const hasHttpRequest = content.includes('## HTTP Request');
      const hasCurlCommand = content.includes('## cURL Command');
      const hasJavaScript = content.includes('## JavaScript (Fetch API)');
      const hasReactComponent = content.includes('## React Component');
      const hasODataBind = content.includes('@odata.bind') || testCase.name.includes('Auto-Selected');
      const hasAuthContext = content.includes('Authentication Context') || !testCase.request.params.arguments.includeAuthContext;
      const hasSchemaInfo = content.includes('Schema Information') || testCase.name.includes('Navigation Property');
      
      console.log('✅ Enhanced Features Check:');
      console.log(`   HTTP Request: ${hasHttpRequest ? '✓' : '✗'}`);
      console.log(`   cURL Command: ${hasCurlCommand ? '✓' : '✗'}`);
      console.log(`   JavaScript: ${hasJavaScript ? '✓' : '✗'}`);
      console.log(`   React Component: ${hasReactComponent ? '✓' : '✗'}`);
      console.log(`   @odata.bind Support: ${hasODataBind ? '✓' : '✗'}`);
      console.log(`   Auth Context: ${hasAuthContext ? '✓' : '✗'}`);
      console.log(`   Schema Info: ${hasSchemaInfo ? '✓' : '✗'}`);
      
      // Show key parts of the response
      if (content.includes('PowerPages WebAPI')) {
        console.log('\n📄 Sample Output:');
        const lines = content.split('\n');
        const httpSection = lines.slice(0, 15).join('\n');
        console.log(httpSection + '...\n');
      }
      
    } catch (error) {
      console.log('❌ Test failed:', error.message);
    }
    
    console.log(''); // Empty line between tests
  }
}

function callMCPServer(serverPath, request) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe']
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
        reject(new Error(`Server exited with code ${code}: ${stderr}`));
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

    child.on('error', (error) => {
      reject(error);
    });

    // Send the request
    child.stdin.write(JSON.stringify(request) + '\n');
    child.stdin.end();
  });
}

// Run the test
testPowerPagesWebAPIEnhanced().catch(console.error);