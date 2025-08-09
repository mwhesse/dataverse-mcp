# Testing the Dataverse MCP Server

This document explains how to test the Dataverse MCP Server using the provided test scripts.

## Quick Start

1. **Setup test environment:**
   ```bash
   # Copy the test environment template
   cp .env.localtest.example .env.localtest
   
   # Edit with your actual Dataverse credentials
   nano .env.localtest
   ```

2. **Test authentication first:**
   ```bash
   npm run test:auth
   ```

3. **Build the server:**
   ```bash
   npm run build
   ```

4. **Run the test server:**
   ```bash
   npm run test:server
   ```

## Test Scripts

### Authentication Test Script

The [`test-auth.cjs`](test-auth.cjs) script provides comprehensive authentication testing:

- ✅ **Azure AD Authentication** - Tests OAuth 2.0 client credentials flow
- ✅ **Token Validation** - Verifies access token generation
- ✅ **Dataverse API Access** - Tests basic API connectivity
- ✅ **Permission Verification** - Checks metadata access permissions
- ✅ **Environment Validation** - Validates all required credentials
- ✅ **Detailed Diagnostics** - Clear success/failure reporting

### Server Test Script

The [`test-server.cjs`](test-server.cjs) script provides:

- ✅ **Environment Validation** - Checks for required credentials
- ✅ **GUID Format Validation** - Validates Client ID and Tenant ID formats
- ✅ **URL Validation** - Ensures Dataverse URL is properly formatted
- ✅ **Secure Display** - Shows masked credentials for verification
- ✅ **Process Management** - Handles server startup and shutdown
- ✅ **Error Handling** - Clear error messages and troubleshooting

## Environment File Format

Your `.env.localtest` file should contain:

```bash
# Required: Your Dataverse environment URL
DATAVERSE_URL=https://your-org.crm.dynamics.com

# Required: Azure App Registration credentials
DATAVERSE_CLIENT_ID=12345678-1234-1234-1234-123456789abc
DATAVERSE_CLIENT_SECRET=your-client-secret-here
DATAVERSE_TENANT_ID=87654321-4321-4321-4321-cba987654321

# Optional: Enable debug logging
DEBUG=true
```

## Running Tests

### Authentication Test (Run First)

Test your credentials before running the full server:

#### Method 1: Using npm script (Recommended)
```bash
npm run test:auth
```

#### Method 2: Direct execution
```bash
node test-auth.cjs
```

#### Expected Authentication Test Output

```
🧪 Dataverse Authentication Test
=================================

📁 Loading environment from: /path/to/.env.localtest
✅ Environment file loaded successfully
🔍 Validating environment variables...
✅ Environment validation passed

📋 Configuration:
   DATAVERSE_URL: https://your-org.crm.dynamics.com
   DATAVERSE_CLIENT_ID: 12345678...
   DATAVERSE_CLIENT_SECRET: ********************
   DATAVERSE_TENANT_ID: 87654321...

🚀 Starting Authentication Tests...

🔐 Testing Azure AD Authentication...
✅ Azure AD Authentication successful!
   Token Type: Bearer
   Expires In: 3599 seconds
   Token Preview: eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6...

🌐 Testing Dataverse API Access...
✅ Dataverse API Access successful!
   Retrieved 5 entities:
   1. account (Account)
   2. contact (Contact)
   3. lead (Lead)
   4. opportunity (Opportunity)
   5. systemuser (User)

👤 Testing WhoAmI API...
✅ WhoAmI API call successful!
📋 Current User Information:
   User ID: 12345678-1234-1234-1234-123456789abc
   Business Unit ID: 87654321-4321-4321-4321-cba987654321
   Organization ID: abcdef12-3456-7890-abcd-ef1234567890

📄 Full WhoAmI Response:
{
  "BusinessUnitId": "87654321-4321-4321-4321-cba987654321",
  "UserId": "12345678-1234-1234-1234-123456789abc",
  "OrganizationId": "abcdef12-3456-7890-abcd-ef1234567890"
}

🔒 Testing Dataverse Permissions...
✅ Metadata access permissions verified!
   ✓ Can read entity definitions
   ✓ Can filter custom entities
   ✓ Ready for schema operations

🎉 All Authentication Tests Passed!
=====================================
✅ Azure AD authentication working
✅ Dataverse API access confirmed
✅ WhoAmI API call successful
✅ Schema operation permissions verified

💡 Your credentials are ready for the MCP server!
🚀 You can now run: npm run test:server
```

### Server Test

After authentication test passes, run the full server:

#### Method 1: Using npm script (Recommended)
```bash
npm run test:server
```

#### Method 2: Direct execution
```bash
node test-server.cjs
```

## Expected Output

When the test script runs successfully, you should see:

```
🚀 Dataverse MCP Server Test Script
=====================================

📁 Loading environment from: /path/to/.env.localtest
✅ Environment file loaded successfully
🔍 Validating environment variables...
✅ Environment validation passed

📋 Configuration:
   DATAVERSE_URL: https://your-org.crm.dynamics.com
   DATAVERSE_CLIENT_ID: 12345678...
   DATAVERSE_CLIENT_SECRET: ********************
   DATAVERSE_TENANT_ID: 87654321...

🎯 Starting Dataverse MCP Server...
📝 Server will run in test mode with stdio transport
🛑 Press Ctrl+C to stop the server

[SERVER] Dataverse MCP server running on stdio

🔗 Server should be running now
💡 You can now test the MCP tools from another terminal or MCP client
📚 See README.md for usage examples
```

## Testing MCP Tools

Once the server is running, you can test it using MCP tools. Here are some examples:

### 1. List Existing Tables
```typescript
await use_mcp_tool("dataverse", "list_dataverse_tables", {
  customOnly: false,
  top: 5
});
```

### 2. Create the "MCP Test" Table
```typescript
await use_mcp_tool("dataverse", "create_dataverse_table", {
  logicalName: "new_mcptest",
  displayName: "MCP Test",
  displayCollectionName: "MCP Tests",
  description: "Test table created by MCP Dataverse server",
  ownershipType: "UserOwned",
  hasActivities: true,
  hasNotes: true,
  primaryNameAttribute: "new_name"
});
```

### 3. Add a Column to the Test Table
```typescript
await use_mcp_tool("dataverse", "create_dataverse_column", {
  entityLogicalName: "new_mcptest",
  logicalName: "new_description",
  displayName: "Description",
  columnType: "Memo",
  maxLength: 2000,
  requiredLevel: "Recommended"
});
```

## Troubleshooting

### Common Issues

1. **"Environment file not found"**
   ```
   ❌ Environment file not found: .env.localtest
   ```
   **Solution:** Copy the example file: `cp .env.localtest.example .env.localtest`

2. **"Missing required environment variables"**
   ```
   ❌ Missing required environment variables: DATAVERSE_CLIENT_ID, DATAVERSE_CLIENT_SECRET
   ```
   **Solution:** Edit `.env.localtest` and add all required credentials

3. **"Server not built"**
   ```
   ❌ Server not built. Please run: npm run build
   ```
   **Solution:** Run `npm run build` to compile the TypeScript code

4. **"Authentication failed"**
   ```
   [SERVER] Authentication failed: Invalid client credentials
   ```
   **Solution:** Verify your Azure App Registration credentials are correct

5. **"Permission denied"**
   ```
   [SERVER] Dataverse API Error: Principal user is missing prvCreateEntity privilege
   ```
   **Solution:** Ensure your app registration has System Administrator role in Dataverse

### Debug Mode

Enable debug logging by adding to your `.env.localtest`:
```bash
DEBUG=true
```

This will provide detailed logging of:
- HTTP requests and responses
- Authentication token exchanges
- API call details
- Error stack traces

### Validation Warnings

The script may show warnings for common issues:

```
⚠️  DATAVERSE_CLIENT_ID doesn't look like a valid GUID
⚠️  DATAVERSE_TENANT_ID doesn't look like a valid GUID
```

These are warnings, not errors. The server will still attempt to run, but double-check your credentials if you see authentication failures.

## Security Notes

- The `.env.localtest` file is automatically gitignored
- Credentials are masked in console output
- Never commit test credentials to version control
- Use separate credentials for testing vs production

## Next Steps

After successful testing:

1. **Configure for production** using MCP environment variables
2. **Deploy to your MCP client** with proper credentials
3. **Create your Dataverse schema** using the available tools
4. **Automate schema deployments** with scripts

For more information, see:
- [`README.md`](README.md) - Complete documentation
- [`SETUP_GUIDE.md`](SETUP_GUIDE.md) - Azure setup instructions