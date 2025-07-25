#!/usr/bin/env node

/**
 * Test script for Dataverse MCP Server
 * This script loads environment variables from .env.localtest and runs the server
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Function to load environment variables from a specific file
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Environment file not found: ${filePath}`);
    console.log(`📝 Please create ${filePath} with your Dataverse credentials.`);
    console.log(`💡 You can copy from .env.example: cp .env.example ${filePath}`);
    process.exit(1);
  }

  const envContent = fs.readFileSync(filePath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  return envVars;
}

// Function to validate required environment variables
function validateEnvironment(envVars) {
  const required = [
    'DATAVERSE_URL',
    'DATAVERSE_CLIENT_ID', 
    'DATAVERSE_CLIENT_SECRET',
    'DATAVERSE_TENANT_ID'
  ];

  const missing = required.filter(key => !envVars[key]);
  
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    console.log(`📝 Please add these variables to .env.localtest`);
    return false;
  }

  // Validate URL format
  if (!envVars.DATAVERSE_URL.startsWith('https://')) {
    console.error(`❌ DATAVERSE_URL must start with https://`);
    return false;
  }

  // Validate GUID format for IDs (basic check)
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!guidRegex.test(envVars.DATAVERSE_CLIENT_ID)) {
    console.warn(`⚠️  DATAVERSE_CLIENT_ID doesn't look like a valid GUID`);
  }
  if (!guidRegex.test(envVars.DATAVERSE_TENANT_ID)) {
    console.warn(`⚠️  DATAVERSE_TENANT_ID doesn't look like a valid GUID`);
  }

  return true;
}

// Main function
function main() {
  console.log('🚀 Dataverse MCP Server Test Script');
  console.log('=====================================\n');

  // Check if build directory exists
  const buildPath = path.join(__dirname, 'build');
  const serverPath = path.join(buildPath, 'index.js');
  
  if (!fs.existsSync(serverPath)) {
    console.error('❌ Server not built. Please run: npm run build');
    process.exit(1);
  }

  // Load environment variables from .env.localtest
  const envFilePath = path.join(__dirname, '.env.localtest');
  console.log(`📁 Loading environment from: ${envFilePath}`);
  
  const envVars = loadEnvFile(envFilePath);
  console.log('✅ Environment file loaded successfully');

  // Validate environment variables
  console.log('🔍 Validating environment variables...');
  if (!validateEnvironment(envVars)) {
    process.exit(1);
  }
  console.log('✅ Environment validation passed');

  // Display configuration (masked)
  console.log('\n📋 Configuration:');
  console.log(`   DATAVERSE_URL: ${envVars.DATAVERSE_URL}`);
  console.log(`   DATAVERSE_CLIENT_ID: ${envVars.DATAVERSE_CLIENT_ID.substring(0, 8)}...`);
  console.log(`   DATAVERSE_CLIENT_SECRET: ${'*'.repeat(20)}`);
  console.log(`   DATAVERSE_TENANT_ID: ${envVars.DATAVERSE_TENANT_ID.substring(0, 8)}...`);

  // Prepare environment for child process
  const childEnv = {
    ...process.env,
    ...envVars,
    NODE_ENV: 'test'
  };

  console.log('\n🎯 Starting Dataverse MCP Server...');
  console.log('📝 Server will run in test mode with stdio transport');
  console.log('🛑 Press Ctrl+C to stop the server\n');

  // Spawn the server process
  const serverProcess = spawn('node', [serverPath], {
    env: childEnv,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Handle server output
  serverProcess.stdout.on('data', (data) => {
    process.stdout.write(`[SERVER] ${data}`);
  });

  serverProcess.stderr.on('data', (data) => {
    process.stderr.write(`[SERVER] ${data}`);
  });

  // Handle server exit
  serverProcess.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ Server exited successfully');
    } else {
      console.log(`\n❌ Server exited with code ${code}`);
    }
  });

  serverProcess.on('error', (error) => {
    console.error(`\n❌ Failed to start server: ${error.message}`);
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping server...');
    serverProcess.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Terminating server...');
    serverProcess.kill('SIGTERM');
  });

  // Test connection after a short delay
  setTimeout(() => {
    console.log('\n🔗 Server should be running now');
    console.log('💡 You can now test the MCP tools from another terminal or MCP client');
    console.log('📚 See README.md for usage examples');
  }, 2000);
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { loadEnvFile, validateEnvironment };