const { spawn } = require('child_process');
const path = require('path');

// Test role creation
async function testRoleCreation() {
  console.log('Testing Dataverse Role Creation...\n');

  const serverPath = path.join(__dirname, 'build', 'index.js');
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let responseData = '';
  let errorData = '';

  server.stdout.on('data', (data) => {
    responseData += data.toString();
  });

  server.stderr.on('data', (data) => {
    errorData += data.toString();
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

  // Wait for initialization response
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Send role creation request
  const roleRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'create_dataverse_role',
      arguments: {
        name: 'Test Role MCP',
        description: 'A test security role created via MCP',
        appliesTo: 'Test users and developers',
        isAutoAssigned: false,
        isInherited: '1',
        summaryOfCoreTablePermissions: 'Basic read access to core tables for testing'
      }
    }
  };

  console.log('Sending role creation request...');
  console.log('Request:', JSON.stringify(roleRequest, null, 2));
  console.log('\n');

  server.stdin.write(JSON.stringify(roleRequest) + '\n');

  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 5000));

  server.kill();

  console.log('=== SERVER OUTPUT ===');
  console.log(responseData);
  
  if (errorData) {
    console.log('\n=== ERROR OUTPUT ===');
    console.log(errorData);
  }

  // Try to parse and display the response
  try {
    const lines = responseData.split('\n').filter(line => line.trim());
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.id === 2) {
          console.log('\n=== ROLE CREATION RESPONSE ===');
          console.log(JSON.stringify(parsed, null, 2));
        }
      } catch (e) {
        // Skip non-JSON lines
      }
    }
  } catch (error) {
    console.log('Error parsing response:', error.message);
  }
}

// Test role listing
async function testRoleListing() {
  console.log('\n\nTesting Dataverse Role Listing...\n');

  const serverPath = path.join(__dirname, 'build', 'index.js');
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let responseData = '';
  let errorData = '';

  server.stdout.on('data', (data) => {
    responseData += data.toString();
  });

  server.stderr.on('data', (data) => {
    errorData += data.toString();
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

  // Wait for initialization response
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Send role listing request
  const listRequest = {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'list_dataverse_roles',
      arguments: {
        customOnly: false,
        includeManaged: true,
        top: 5
      }
    }
  };

  console.log('Sending role listing request...');
  console.log('Request:', JSON.stringify(listRequest, null, 2));
  console.log('\n');

  server.stdin.write(JSON.stringify(listRequest) + '\n');

  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 5000));

  server.kill();

  console.log('=== SERVER OUTPUT ===');
  console.log(responseData);
  
  if (errorData) {
    console.log('\n=== ERROR OUTPUT ===');
    console.log(errorData);
  }

  // Try to parse and display the response
  try {
    const lines = responseData.split('\n').filter(line => line.trim());
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.id === 3) {
          console.log('\n=== ROLE LISTING RESPONSE ===');
          console.log(JSON.stringify(parsed, null, 2));
        }
      } catch (e) {
        // Skip non-JSON lines
      }
    }
  } catch (error) {
    console.log('Error parsing response:', error.message);
  }
}

// Run tests
async function runTests() {
  try {
    await testRoleCreation();
    await testRoleListing();
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTests();