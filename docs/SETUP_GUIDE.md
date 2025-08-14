# Dataverse MCP Server Setup Guide

This guide will help you set up the Dataverse MCP Server with a demo/development environment.

## Quick Start for Demo/Development

### Option 1: Microsoft Power Platform Developer Plan (Recommended)

1. **Sign up for a free developer environment:**
   - Go to [Power Platform Developer Plan](https://powerapps.microsoft.com/en-us/developerplan/)
   - Sign up with your Microsoft account
   - This gives you a free Dataverse environment for development

2. **Get your environment URL:**
   - Go to [Power Platform Admin Center](https://admin.powerplatform.microsoft.com/)
   - Select your environment
   - Copy the Environment URL (e.g., `https://yourorg.crm.dynamics.com`)

### Option 2: Microsoft 365 Developer Program

1. **Join the Microsoft 365 Developer Program:**
   - Go to [Microsoft 365 Developer Program](https://developer.microsoft.com/en-us/microsoft-365/dev-program)
   - Sign up for a free account
   - Get a free Microsoft 365 E5 subscription with Dataverse

## Azure App Registration Setup

### Step 1: Create App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Fill in the details:
   - **Name**: `Dataverse MCP Server`
   - **Supported account types**: `Accounts in this organizational directory only`
   - **Redirect URI**: Leave blank
5. Click **Register**

### Step 2: Configure API Permissions

1. In your app registration, go to **API permissions**
2. Click **Add a permission**
3. Select **Dynamics CRM**
4. Choose **Application permissions**
5. Select **user_impersonation**
6. Click **Add permissions**
7. Click **Grant admin consent for [Your Organization]**
8. Confirm by clicking **Yes**

### Step 3: Create Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Provide a description: `MCP Server Secret`
4. Set expiration: `24 months` (recommended)
5. Click **Add**
6. **IMPORTANT**: Copy the secret value immediately and store it securely

### Step 4: Get Required Information

Collect the following information:

1. **Tenant ID**: 
   - Go to **Azure Active Directory** > **Overview**
   - Copy the **Tenant ID**

2. **Client ID**: 
   - In your app registration, go to **Overview**
   - Copy the **Application (client) ID**

3. **Client Secret**: 
   - The secret value you copied in Step 3

4. **Dataverse URL**: 
   - Your environment URL from Power Platform Admin Center

## Configure the MCP Server

The server supports flexible configuration with environment variable precedence:
1. **MCP environment variables** (highest priority - overrides everything)
2. **System environment variables**
3. **`.env` file variables** (lowest priority)

### Option 1: Using .env file (Recommended for Development)

1. **Create environment file:**
   ```bash
   cd /Users/martin/code/dataverse-mcp
   cp .env.example .env
   ```

2. **Edit the .env file with your credentials:**
   ```bash
   # Open the .env file in your editor
   nano .env
   ```
   
   Update with your actual values:
   ```
   DATAVERSE_URL=https://your-actual-org.crm.dynamics.com
   DATAVERSE_CLIENT_ID=your-actual-client-id
   DATAVERSE_CLIENT_SECRET=your-actual-client-secret
   DATAVERSE_TENANT_ID=your-actual-tenant-id
   ```

3. **Update the MCP settings file:**
   
   The file is located at:
   ```
   /Users/martin/Library/Application Support/Code/User/globalStorage/kilocode.kilo-code/settings/mcp_settings.json
   ```
   
   Use this simplified configuration:
   ```json
   {
     "mcpServers": {
       "dataverse": {
         "command": "node",
         "args": ["/Users/martin/code/dataverse-mcp/build/index.js"],
         "disabled": false,
         "alwaysAllow": [],
         "disabledTools": []
       }
     }
   }
   ```

### Option 2: Using MCP environment variables (Recommended for Production)

Configure environment variables directly in MCP settings. **These will override any values in the .env file:**

```json
{
  "mcpServers": {
    "dataverse": {
      "command": "node",
      "args": ["/Users/martin/code/dataverse-mcp/build/index.js"],
      "env": {
        "DATAVERSE_URL": "https://your-actual-org.crm.dynamics.com",
        "DATAVERSE_CLIENT_ID": "your-actual-client-id",
        "DATAVERSE_CLIENT_SECRET": "your-actual-client-secret",
        "DATAVERSE_TENANT_ID": "your-actual-tenant-id"
      },
      "disabled": false,
      "alwaysAllow": [],
      "disabledTools": []
    }
  }
}
```

### Option 3: Hybrid Configuration

You can combine both approaches. For example, keep common settings in `.env` and override sensitive values via MCP:

**.env file (development defaults):**
```
DATAVERSE_URL=https://dev-org.crm.dynamics.com
DATAVERSE_TENANT_ID=common-tenant-id
```

**MCP settings (production overrides):**
```json
{
  "mcpServers": {
    "dataverse": {
      "command": "node",
      "args": ["/Users/martin/code/dataverse-mcp/build/index.js"],
      "env": {
        "DATAVERSE_URL": "https://prod-org.crm.dynamics.com",
        "DATAVERSE_CLIENT_ID": "prod-client-id",
        "DATAVERSE_CLIENT_SECRET": "prod-client-secret"
      },
      "disabled": false,
      "alwaysAllow": [],
      "disabledTools": []
    }
  }
}
```

**Note:** The MCP environment variables will take precedence and override the `.env` file values.

## Testing the Setup

### 1. Verify Server Starts

Run the server directly to test:
```bash
cd /Users/martin/code/dataverse-mcp
DATAVERSE_URL="your-url" \
DATAVERSE_CLIENT_ID="your-client-id" \
DATAVERSE_CLIENT_SECRET="your-client-secret" \
DATAVERSE_TENANT_ID="your-tenant-id" \
node build/index.js
```

### 2. Test with MCP Tools

Once configured, you can test the tools:

```typescript
// List existing tables
await use_mcp_tool("dataverse", "list_dataverse_tables", {
  customOnly: false,
  top: 10
});

// Create a test table
await use_mcp_tool("dataverse", "create_dataverse_table", {
  logicalName: "new_test",
  displayName: "Test Table",
  displayCollectionName: "Test Tables",
  description: "A test table created by MCP server"
});
```

## Troubleshooting

### Common Issues

1. **"Authentication failed"**
   - Verify all credentials are correct
   - Check that admin consent was granted
   - Ensure the app registration has Dataverse permissions

2. **"Permission denied"**
   - The app needs System Administrator role in Dataverse
   - Go to Power Platform Admin Center > Your Environment > Settings > Users + permissions > Application users
   - Create an application user for your app registration
   - Assign System Administrator role

3. **"Environment not found"**
   - Verify the Dataverse URL is correct
   - Ensure the environment is active
   - Check you have access to the environment

### Debug Mode

Enable debug logging:
```bash
DEBUG=true node build/index.js
```

## Security Best Practices

1. **Never commit secrets to version control**
2. **Use environment variables for credentials**
3. **Rotate client secrets regularly**
4. **Use least privilege principle**
5. **Monitor API usage**

## Next Steps

Once configured, you can:

1. Create custom tables and columns
2. Set up relationships between entities
3. Manage global option sets
4. Automate schema deployments
5. Build custom solutions

## Support

- [Dataverse Web API Documentation](https://docs.microsoft.com/en-us/powerapps/developer/data-platform/webapi/)
- [Power Platform Developer Documentation](https://docs.microsoft.com/en-us/power-platform/developer/)
- [Azure AD App Registration Guide](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)