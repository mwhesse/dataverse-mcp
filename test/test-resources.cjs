const { spawn } = require('child_process');
const path = require('path');

// Test the MCP server with resource requests
async function testResources() {
  console.log('Testing MCP Resources...');
  
  const serverPath = path.join(__dirname, '..', 'build', 'index.js');
  
  // Start the MCP server
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      DATAVERSE_URL: 'https://test.crm.dynamics.com',
      DATAVERSE_CLIENT_ID: 'test-client-id',
      DATAVERSE_CLIENT_SECRET: 'test-secret',
      DATAVERSE_TENANT_ID: 'test-tenant-id'
    }
  });

  let serverOutput = '';
  let serverError = '';

  server.stdout.on('data', (data) => {
    serverOutput += data.toString();
  });

  server.stderr.on('data', (data) => {
    serverError += data.toString();
  });

  // Test 1: Initialize the server
  console.log('1. Testing server initialization...');
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {
        resources: { subscribe: true, listChanged: true },
        tools: { listChanged: true }
      },
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };

  server.stdin.write(JSON.stringify(initRequest) + '\n');

  // Wait for initialization response
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: List resources
  console.log('2. Testing resource listing...');
  const listResourcesRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'resources/list'
  };

  server.stdin.write(JSON.stringify(listResourcesRequest) + '\n');

  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 3: Test WebAPI resource
  console.log('3. Testing WebAPI resource...');
  const webApiResourceRequest = {
    jsonrpc: '2.0',
    id: 3,
    method: 'resources/read',
    params: {
      uri: 'webapi://retrieve/accounts/123e4567-e89b-12d3-a456-426614174000'
    }
  };

  server.stdin.write(JSON.stringify(webApiResourceRequest) + '\n');

  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 4: Test PowerPages resource
  console.log('4. Testing PowerPages resource...');
  const powerPagesResourceRequest = {
    jsonrpc: '2.0',
    id: 4,
    method: 'resources/read',
    params: {
      uri: 'powerpages://retrieveMultiple/contacts'
    }
  };

  server.stdin.write(JSON.stringify(powerPagesResourceRequest) + '\n');

  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 5: Test PowerPages auth patterns resource
  console.log('5. Testing PowerPages auth patterns resource...');
  const authPatternsRequest = {
    jsonrpc: '2.0',
    id: 5,
    method: 'resources/read',
    params: {
      uri: 'powerpages-auth://patterns'
    }
  };

  server.stdin.write(JSON.stringify(authPatternsRequest) + '\n');

  // Wait for final response
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Close the server
  server.kill();

  console.log('\n=== Server Output ===');
  console.log(serverOutput);
  
  if (serverError) {
    console.log('\n=== Server Errors ===');
    console.log(serverError);
  }

  // Basic validation
  if (serverError.includes('Dataverse MCP server running on stdio')) {
    console.log('\n✅ Server started successfully');
  } else {
    console.log('\n❌ Server failed to start');
  }

  if (serverOutput.includes('webapi://') || serverOutput.includes('powerpages://')) {
    console.log('✅ Resources appear to be registered');
  } else {
    console.log('❌ Resources may not be properly registered');
  }

  console.log('\nTest completed. Check the output above for detailed results.');
}

// Run the test
testResources().catch(console.error);