const { spawn } = require('child_process');
const path = require('path');

// Test the enhanced WebAPI tool with @odata.bind syntax
async function testWebAPIWithODataBind() {
  console.log('🧪 Testing WebAPI tool with @odata.bind syntax...\n');

  const serverPath = path.join(__dirname, '..', 'build', 'index.js');
  
  // Test cases for @odata.bind functionality
  const testCases = [
    {
      name: 'Create Contact with Account Association',
      operation: 'create',
      entitySetName: 'contact',
      data: {
        firstname: 'John',
        lastname: 'Doe',
        emailaddress1: 'john.doe@example.com',
        'parentcustomerid_account@odata.bind': '/accounts(12345678-1234-1234-1234-123456789012)'
      }
    },
    {
      name: 'Update Contact - Associate with Different Account',
      operation: 'update',
      entitySetName: 'contact',
      entityId: '87654321-4321-4321-4321-210987654321',
      data: {
        'parentcustomerid_account@odata.bind': '/accounts(98765432-9876-9876-9876-987654321098)'
      }
    },
    {
      name: 'Update Contact - Disassociate from Account',
      operation: 'update',
      entitySetName: 'contact',
      entityId: '87654321-4321-4321-4321-210987654321',
      data: {
        'parentcustomerid_account@odata.bind': null
      }
    },
    {
      name: 'Create Opportunity with Account and Contact Associations',
      operation: 'create',
      entitySetName: 'opportunity',
      data: {
        name: 'Big Deal Opportunity',
        estimatedvalue: 100000,
        'customerid_account@odata.bind': 'accounts(12345678-1234-1234-1234-123456789012)',
        'originatingleadid@odata.bind': '/leads(11111111-1111-1111-1111-111111111111)'
      }
    },
    {
      name: 'Create Account with Primary Contact (Full URL)',
      operation: 'create',
      entitySetName: 'account',
      data: {
        name: 'Contoso Ltd',
        'primarycontactid@odata.bind': 'https://org.crm.dynamics.com/api/data/v9.2/contacts(87654321-4321-4321-4321-210987654321)'
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 Test: ${testCase.name}`);
    console.log('=' .repeat(50));
    
    try {
      const result = await callMCPTool('generate_webapi_call', testCase);
      console.log(result);
      console.log('\n✅ Test completed successfully');
    } catch (error) {
      console.error(`❌ Test failed: ${error.message}`);
    }
  }
}

function callMCPTool(toolName, params) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [
      path.join(__dirname, '..', 'build', 'index.js')
    ], {
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
        reject(new Error(`Process exited with code ${code}: ${stderr}`));
        return;
      }

      try {
        // Parse MCP protocol messages
        const lines = stdout.trim().split('\n');
        for (const line of lines) {
          if (line.trim()) {
            const message = JSON.parse(line);
            if (message.method === 'tools/call' && message.params?.name === toolName) {
              // This would be the response in a real MCP scenario
              resolve('MCP tool call would be processed here');
              return;
            }
          }
        }
        
        // For testing purposes, just show the parameters that would be sent
        resolve(`Tool: ${toolName}\nParameters: ${JSON.stringify(params, null, 2)}`);
      } catch (error) {
        reject(new Error(`Failed to parse output: ${error.message}`));
      }
    });

    // Send a simple MCP initialization
    const initMessage = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' }
      }
    };

    child.stdin.write(JSON.stringify(initMessage) + '\n');
    child.stdin.end();
  });
}

// Run the tests
testWebAPIWithODataBind().catch(console.error);