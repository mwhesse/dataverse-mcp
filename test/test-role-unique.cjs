const { spawn } = require('child_process');
const path = require('path');

// Test role creation with unique name
async function testUniqueRoleCreation() {
  const timestamp = Date.now();
  const uniqueName = `Test Role MCP ${timestamp}`;
  
  console.log(`Testing Dataverse Role Creation with unique name: ${uniqueName}\n`);

  const serverPath = path.join(__dirname, 'build', 'index.js');
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let allOutput = '';
  let allErrors = '';

  server.stdout.on('data', (data) => {
    const output = data.toString();
    allOutput += output;
  });

  server.stderr.on('data', (data) => {
    const error = data.toString();
    allErrors += error;
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

  server.stdin.write(JSON.stringify(initRequest) + '\n');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Send role creation request with unique name
  const roleRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'create_dataverse_role',
      arguments: {
        name: uniqueName,
        description: 'A test security role created via MCP with unique timestamp',
        appliesTo: 'Test users and developers',
        isAutoAssigned: false,
        isInherited: '1',
        summaryOfCoreTablePermissions: 'Basic read access to core tables for testing'
      }
    }
  };

  console.log('Sending role creation request...');
  server.stdin.write(JSON.stringify(roleRequest) + '\n');

  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 8000));

  server.kill();
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('=== ROLE CREATION TEST RESULTS ===');
  
  // Parse responses
  const lines = allOutput.split('\n').filter(line => line.trim());
  let creationResponse = null;
  
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (parsed.id === 2) {
        creationResponse = parsed;
        break;
      }
    } catch (e) {
      // Skip non-JSON lines
    }
  }

  if (creationResponse) {
    if (creationResponse.result.isError) {
      console.log('❌ ROLE CREATION FAILED:');
      console.log(creationResponse.result.content[0].text);
    } else {
      console.log('✅ ROLE CREATION SUCCESSFUL:');
      console.log(creationResponse.result.content[0].text);
    }
  } else {
    console.log('❌ NO RESPONSE RECEIVED');
  }

  return creationResponse;
}

// Test role retrieval if creation was successful
async function testRoleRetrieval(roleId) {
  if (!roleId) {
    console.log('\nSkipping role retrieval test - no role ID available');
    return;
  }

  console.log(`\nTesting role retrieval for ID: ${roleId}`);

  const serverPath = path.join(__dirname, 'build', 'index.js');
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let allOutput = '';

  server.stdout.on('data', (data) => {
    allOutput += data.toString();
  });

  server.stderr.on('data', (data) => {
    // Ignore stderr for this test
  });

  // Initialize
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' }
    }
  };

  server.stdin.write(JSON.stringify(initRequest) + '\n');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Get role
  const getRequest = {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'get_dataverse_role',
      arguments: { roleId: roleId }
    }
  };

  server.stdin.write(JSON.stringify(getRequest) + '\n');
  await new Promise(resolve => setTimeout(resolve, 5000));

  server.kill();

  // Parse response
  const lines = allOutput.split('\n').filter(line => line.trim());
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (parsed.id === 3) {
        console.log('✅ ROLE RETRIEVAL SUCCESSFUL:');
        console.log(parsed.result.content[0].text);
        return;
      }
    } catch (e) {
      // Skip non-JSON lines
    }
  }

  console.log('❌ ROLE RETRIEVAL FAILED');
}

// Run tests
async function runTests() {
  try {
    const creationResult = await testUniqueRoleCreation();
    
    // Extract role ID from successful creation
    if (creationResult && !creationResult.result.isError) {
      const responseText = creationResult.result.content[0].text;
      const roleIdMatch = responseText.match(/Role ID: ([a-f0-9-]+)/i);
      if (roleIdMatch) {
        await testRoleRetrieval(roleIdMatch[1]);
      }
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTests();