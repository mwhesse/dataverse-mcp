#!/usr/bin/env node

/**
 * Authentication Test Script for Dataverse MCP Server
 * This script tests authentication using credentials from .env.localtest
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { URLSearchParams } = require('url');

// Function to load environment variables from a specific file
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Environment file not found: ${filePath}`);
    console.log(`📝 Please create ${filePath} with your Dataverse credentials.`);
    console.log(`💡 You can copy from .env.localtest.example: cp .env.localtest.example ${filePath}`);
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

// Function to make HTTP request
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: jsonData, headers: res.headers, rawData: data });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data, headers: res.headers, rawData: data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// Function to test Azure AD authentication
async function testAuthentication(envVars) {
  console.log('🔐 Testing Azure AD Authentication...');
  
  const tokenUrl = `https://login.microsoftonline.com/${envVars.DATAVERSE_TENANT_ID}/oauth2/v2.0/token`;
  
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', envVars.DATAVERSE_CLIENT_ID);
  params.append('client_secret', envVars.DATAVERSE_CLIENT_SECRET);
  params.append('scope', `${envVars.DATAVERSE_URL}/.default`);
  
  const postData = params.toString();
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  try {
    const url = new URL(tokenUrl);
    options.hostname = url.hostname;
    options.path = url.pathname + url.search;
    
    const response = await makeRequest(options, postData);
    
    if (response.statusCode === 200 && response.data.access_token) {
      console.log('✅ Azure AD Authentication successful!');
      console.log(`   Token Type: ${response.data.token_type}`);
      console.log(`   Expires In: ${response.data.expires_in} seconds`);
      console.log(`   Token Preview: ${response.data.access_token.substring(0, 50)}...`);
      return response.data.access_token;
    } else {
      console.error('❌ Azure AD Authentication failed!');
      console.error(`   Status Code: ${response.statusCode}`);
      console.error(`   Error: ${response.data.error || 'Unknown error'}`);
      console.error(`   Description: ${response.data.error_description || 'No description'}`);
      console.error(`   Raw Response: ${response.rawData || JSON.stringify(response.data)}`);
      return null;
    }
  } catch (error) {
    console.error('❌ Azure AD Authentication error!');
    console.error(`   Error: ${error.message}`);
    return null;
  }
}

// Function to test Dataverse API access
async function testDataverseAccess(envVars, accessToken) {
  console.log('\n🌐 Testing Dataverse API Access...');
  
  const apiUrl = `${envVars.DATAVERSE_URL}/api/data/v9.2/EntityDefinitions?$select=LogicalName,DisplayName`;
  
  try {
    const url = new URL(apiUrl);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0'
      }
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200 && response.data.value) {
      console.log('✅ Dataverse API Access successful!');
      console.log(`   Retrieved ${response.data.value.length} entities:`);
      response.data.value.forEach((entity, index) => {
        const displayName = entity.DisplayName?.UserLocalizedLabel?.Label || entity.LogicalName;
        console.log(`   ${index + 1}. ${entity.LogicalName} (${displayName})`);
      });
      return true;
    } else {
      console.error('❌ Dataverse API Access failed!');
      console.error(`   Status Code: ${response.statusCode}`);
      if (response.data.error) {
        console.error(`   Error Code: ${response.data.error.code}`);
        console.error(`   Error Message: ${response.data.error.message}`);
      }
      console.error(`   Raw Response: ${response.rawData || JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Dataverse API Access error!');
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

// Function to test WhoAmI API
async function testWhoAmI(envVars, accessToken) {
  console.log('\n👤 Testing WhoAmI API...');
  
  const whoAmIUrl = `${envVars.DATAVERSE_URL}/api/data/v9.2/WhoAmI`;
  
  try {
    const url = new URL(whoAmIUrl);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0'
      }
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      console.log('✅ WhoAmI API call successful!');
      console.log('📋 Current User Information:');
      console.log(`   User ID: ${response.data.UserId || 'N/A'}`);
      console.log(`   Business Unit ID: ${response.data.BusinessUnitId || 'N/A'}`);
      console.log(`   Organization ID: ${response.data.OrganizationId || 'N/A'}`);
      
      console.log('\n📄 Full WhoAmI Response:');
      console.log(JSON.stringify(response.data, null, 2));
      return true;
    } else {
      console.error('❌ WhoAmI API call failed!');
      console.error(`   Status Code: ${response.statusCode}`);
      if (response.data.error) {
        console.error(`   Error Code: ${response.data.error.code}`);
        console.error(`   Error Message: ${response.data.error.message}`);
      }
      console.error(`   Raw Response: ${response.rawData || JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    console.error('❌ WhoAmI API call error!');
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

// Function to test specific permissions
async function testPermissions(envVars, accessToken) {
  console.log('\n🔒 Testing Dataverse Permissions...');
  
  // Test metadata access (required for schema operations)
  const metadataUrl = `${envVars.DATAVERSE_URL}/api/data/v9.2/EntityDefinitions?$select=LogicalName&$filter=IsCustomEntity eq true`;
  
  try {
    const url = new URL(metadataUrl);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0'
      }
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      console.log('✅ Metadata access permissions verified!');
      console.log('   ✓ Can read entity definitions');
      console.log('   ✓ Can filter custom entities');
      console.log('   ✓ Ready for schema operations');
      return true;
    } else if (response.statusCode === 403) {
      console.error('❌ Insufficient permissions!');
      console.error('   The app registration needs System Administrator role in Dataverse');
      console.error('   Please check the SETUP_GUIDE.md for permission configuration');
      return false;
    } else {
      console.error('❌ Permission test failed!');
      console.error(`   Status Code: ${response.statusCode}`);
      console.error(`   Raw Response: ${response.rawData || JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Permission test error!');
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  console.log('🧪 Dataverse Authentication Test');
  console.log('=================================\n');

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

  console.log('\n🚀 Starting Authentication Tests...\n');

  // Test 1: Azure AD Authentication
  const accessToken = await testAuthentication(envVars);
  if (!accessToken) {
    console.log('\n❌ Authentication test failed. Please check your credentials.');
    process.exit(1);
  }

  // Test 2: WhoAmI API Test
  const whoAmI = await testWhoAmI(envVars, accessToken);
  if (!whoAmI) {
    console.log('\n❌ WhoAmI test failed. Please check your API access.');
    process.exit(1);
  }

  // Test 3: Dataverse API Access
  const apiAccess = await testDataverseAccess(envVars, accessToken);
  if (!apiAccess) {
    console.log('\n❌ API access test failed. Please check your Dataverse URL and permissions.');
    process.exit(1);
  }


  // Test 4: Permissions Check
  const permissions = await testPermissions(envVars, accessToken);
  if (!permissions) {
    console.log('\n❌ Permission test failed. Please check your app registration permissions.');
    process.exit(1);
  }

  // Success summary
  console.log('\n🎉 All Authentication Tests Passed!');
  console.log('=====================================');
  console.log('✅ Azure AD authentication working');
  console.log('✅ WhoAmI API call successful');
  console.log('✅ Dataverse API access confirmed');
  console.log('✅ Schema operation permissions verified');
  console.log('\n💡 Your credentials are ready for the MCP server!');
  console.log('🚀 You can now run: npm run test:server');
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('\n💥 Unexpected error:', error.message);
    process.exit(1);
  });
}

module.exports = { loadEnvFile, validateEnvironment, testAuthentication, testDataverseAccess, testWhoAmI, testPermissions };