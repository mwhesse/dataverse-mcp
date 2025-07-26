const { spawn } = require('child_process');
const path = require('path');

// Test business unit operations
async function testBusinessUnitOperations() {
  console.log('🏢 Testing Business Unit Operations...\n');

  const serverPath = path.join(__dirname, 'build', 'index.js');
  
  const tests = [
    {
      name: 'List Business Units',
      tool: 'list_dataverse_businessunits',
      args: {
        top: 10,
        filter: 'isdisabled eq false'
      }
    },
    {
      name: 'Create Business Unit',
      tool: 'create_dataverse_businessunit',
      args: {
        name: 'MCP Test Business Unit',
        description: 'Test business unit created by MCP server',
        divisionName: 'Technology',
        emailAddress: 'testbu@company.com',
        costCenter: 'TECH-001',
        creditLimit: 50000,
        address1_name: 'Main Office',
        address1_line1: '123 Tech Street',
        address1_city: 'Seattle',
        address1_stateorprovince: 'WA',
        address1_postalcode: '98101',
        address1_country: 'United States',
        address1_telephone1: '+1-555-0100',
        webSiteUrl: 'https://tech.company.com'
      }
    },
    {
      name: 'Get Root Business Unit',
      tool: 'list_dataverse_businessunits',
      args: {
        filter: 'parentbusinessunitid eq null',
        top: 1
      }
    },
    {
      name: 'Get Business Unit Hierarchy',
      tool: 'get_businessunit_hierarchy',
      args: {
        businessUnitId: 'root-business-unit-id' // This will need to be updated with actual ID
      }
    },
    {
      name: 'Get Business Unit Users',
      tool: 'get_businessunit_users',
      args: {
        businessUnitId: 'root-business-unit-id', // This will need to be updated with actual ID
        includeSubsidiaryUsers: false
      }
    },
    {
      name: 'Get Business Unit Teams',
      tool: 'get_businessunit_teams',
      args: {
        businessUnitId: 'root-business-unit-id', // This will need to be updated with actual ID
        includeSubsidiaryTeams: false
      }
    }
  ];

  for (const test of tests) {
    console.log(`📋 ${test.name}...`);
    
    try {
      const result = await runMCPTool(serverPath, test.tool, test.args);
      
      if (result.success) {
        console.log(`✅ ${test.name} - SUCCESS`);
        
        // Show relevant data based on test type
        if (test.name === 'List Business Units' && result.data) {
          console.log(`   Found ${result.data.length} business units`);
          if (result.data.length > 0) {
            console.log(`   First BU: ${result.data[0].name} (${result.data[0].businessUnitId})`);
          }
        } else if (test.name === 'Create Business Unit' && result.businessUnitId) {
          console.log(`   Created Business Unit ID: ${result.businessUnitId}`);
        } else if (test.name === 'Get Root Business Unit' && result.data) {
          console.log(`   Root BU: ${result.data[0]?.name} (${result.data[0]?.businessUnitId})`);
        }
        
        console.log('');
      } else {
        console.log(`❌ ${test.name} - FAILED`);
        console.log(`   Error: ${result.error}`);
        console.log('');
      }
    } catch (error) {
      console.log(`❌ ${test.name} - ERROR`);
      console.log(`   ${error.message}`);
      console.log('');
    }
  }
}

function runMCPTool(serverPath, toolName, args) {
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
        reject(new Error(`Process exited with code ${code}. Stderr: ${stderr}`));
        return;
      }

      try {
        // Parse the MCP response
        const lines = stdout.trim().split('\n');
        const lastLine = lines[lines.length - 1];
        
        if (lastLine && lastLine.startsWith('{')) {
          const response = JSON.parse(lastLine);
          
          if (response.content && response.content[0] && response.content[0].text) {
            const resultText = response.content[0].text;
            
            // Try to parse JSON from the result text
            try {
              const jsonMatch = resultText.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                resolve(result);
              } else {
                resolve({ success: true, message: resultText });
              }
            } catch (parseError) {
              resolve({ success: true, message: resultText });
            }
          } else if (response.error) {
            resolve({ success: false, error: response.error });
          } else {
            resolve({ success: true, data: response });
          }
        } else {
          resolve({ success: true, message: stdout });
        }
      } catch (error) {
        reject(new Error(`Failed to parse response: ${error.message}. Output: ${stdout}`));
      }
    });

    // Send the MCP request
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    };

    child.stdin.write(JSON.stringify(request) + '\n');
    child.stdin.end();

    // Set timeout
    setTimeout(() => {
      child.kill();
      reject(new Error('Test timeout'));
    }, 30000);
  });
}

// Run the tests
testBusinessUnitOperations().catch(console.error);