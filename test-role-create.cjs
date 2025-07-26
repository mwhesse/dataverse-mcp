const { spawn } = require('child_process');
const path = require('path');

// Test role creation with better error handling
async function testRoleCreationDetailed() {
  console.log('Testing Dataverse Role Creation with detailed logging...\n');

  const serverPath = path.join(__dirname, 'build', 'index.js');
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let allOutput = '';
  let allErrors = '';

  server.stdout.on('data', (data) => {
    const output = data.toString();
    allOutput += output;
    console.log('STDOUT:', output);
  });

  server.stderr.on('data', (data) => {
    const error = data.toString();
    allErrors += error;
    console.log('STDERR:', error);
  });

  // Send initialization request
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };

  console.log('Sending initialization request...');
  server.stdin.write(JSON.stringify(initRequest) + '\n');

  // Wait for initialization
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Send role creation request
  const roleRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'create_dataverse_role',
      arguments: {
        name: 'Test Role MCP Detailed',
        description: 'A test security role created via MCP with detailed logging',
        appliesTo: 'Test users and developers',
        isAutoAssigned: false,
        isInherited: '1',
        summaryOfCoreTablePermissions: 'Basic read access to core tables for testing'
      }
    }
  };

  console.log('\nSending role creation request...');
  console.log('Request:', JSON.stringify(roleRequest, null, 2));
  
  server.stdin.write(JSON.stringify(roleRequest) + '\n');

  // Wait longer for response
  console.log('\nWaiting for response...');
  await new Promise(resolve => setTimeout(resolve, 10000));

  console.log('\nClosing server...');
  server.kill();

  // Wait for process to close
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('\n=== FINAL OUTPUT ANALYSIS ===');
  
  // Parse all JSON responses
  const lines = allOutput.split('\n').filter(line => line.trim());
  let foundResponse = false;
  
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (parsed.id === 2) {
        console.log('\n✅ ROLE CREATION RESPONSE FOUND:');
        console.log(JSON.stringify(parsed, null, 2));
        foundResponse = true;
      } else if (parsed.id === 1) {
        console.log('\n✅ INITIALIZATION RESPONSE:');
        console.log(JSON.stringify(parsed, null, 2));
      }
    } catch (e) {
      // Skip non-JSON lines
    }
  }

  if (!foundResponse) {
    console.log('\n❌ NO ROLE CREATION RESPONSE FOUND');
    console.log('This might indicate an error in the role creation process.');
  }

  if (allErrors) {
    console.log('\n=== ALL ERRORS ===');
    console.log(allErrors);
  }
}

// Run the detailed test
testRoleCreationDetailed().catch(console.error);