// Load environment variables from .env file first
require('dotenv').config();

const axios = require('axios');

// Environment variables
const DATAVERSE_URL = process.env.DATAVERSE_URL;
const CLIENT_ID = process.env.DATAVERSE_CLIENT_ID;
const CLIENT_SECRET = process.env.DATAVERSE_CLIENT_SECRET;
const TENANT_ID = process.env.DATAVERSE_TENANT_ID;

if (!DATAVERSE_URL || !CLIENT_ID || !CLIENT_SECRET || !TENANT_ID) {
  console.error('Missing required environment variables');
  console.error('DATAVERSE_URL:', DATAVERSE_URL ? 'Set' : 'Missing');
  console.error('CLIENT_ID:', CLIENT_ID ? 'Set' : 'Missing');
  console.error('CLIENT_SECRET:', CLIENT_SECRET ? 'Set' : 'Missing');
  console.error('TENANT_ID:', TENANT_ID ? 'Set' : 'Missing');
  process.exit(1);
}

async function authenticate() {
  const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
  
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', CLIENT_ID);
  params.append('client_secret', CLIENT_SECRET);
  params.append('scope', `${DATAVERSE_URL}/.default`);

  try {
    const response = await axios.post(tokenUrl, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return response.data.access_token;
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

async function createPublisher(token) {
  const publisherData = {
    friendlyname: "XYZ Test Publisher",
    uniquename: "xyzpublisher",
    description: "Test publisher for XYZ prefix demonstration",
    customizationprefix: "xyz",
    customizationoptionvalueprefix: 20000
  };

  try {
    const response = await axios.post(`${DATAVERSE_URL}/api/data/v9.2/publishers`, publisherData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('✅ Publisher created successfully');
    console.log('Publisher ID:', response.headers['odata-entityid']);
    
    // Extract publisher ID from the response header
    const publisherIdMatch = response.headers['odata-entityid'].match(/\(([^)]+)\)/);
    return publisherIdMatch ? publisherIdMatch[1] : null;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.error?.message?.includes('already exists')) {
      console.log('⚠️ Publisher already exists, retrieving existing publisher...');
      
      // Get existing publisher
      const getResponse = await axios.get(`${DATAVERSE_URL}/api/data/v9.2/publishers?$filter=uniquename eq 'xyzpublisher'&$select=publisherid`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (getResponse.data.value && getResponse.data.value.length > 0) {
        console.log('✅ Found existing publisher');
        return getResponse.data.value[0].publisherid;
      }
    }
    throw new Error(`Failed to create publisher: ${error.response?.data?.error?.message || error.message}`);
  }
}

async function createSolution(token, publisherId) {
  const solutionData = {
    friendlyname: "XYZ Test Solution",
    uniquename: "xyzsolution",
    description: "Test solution for XYZ prefix demonstration",
    version: "1.0.0.0",
    "publisherid@odata.bind": `/publishers(${publisherId})`
  };

  try {
    const response = await axios.post(`${DATAVERSE_URL}/api/data/v9.2/solutions`, solutionData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('✅ Solution created successfully');
    console.log('Solution ID:', response.headers['odata-entityid']);
    return true;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.error?.message?.includes('already exists')) {
      console.log('⚠️ Solution already exists');
      return true;
    }
    throw new Error(`Failed to create solution: ${error.response?.data?.error?.message || error.message}`);
  }
}

async function testSolutionCreation() {
  try {
    console.log('🔐 Authenticating...');
    const token = await authenticate();
    console.log('✅ Authentication successful');

    console.log('\n📦 Creating publisher with "xyz" prefix...');
    const publisherId = await createPublisher(token);
    
    if (!publisherId) {
      throw new Error('Failed to get publisher ID');
    }

    console.log('\n🏗️ Creating solution linked to publisher...');
    await createSolution(token, publisherId);

    console.log('\n🎉 Test solution setup complete!');
    console.log('\nNext steps:');
    console.log('1. Restart the MCP server to pick up new tools');
    console.log('2. Use set_solution_context with "xyzsolution"');
    console.log('3. Create tables/columns that will use "xyz" prefix');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testSolutionCreation();