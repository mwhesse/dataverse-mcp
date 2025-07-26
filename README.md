# Dataverse MCP Server

A Model Context Protocol (MCP) server for Microsoft Dataverse that enables schema operations including creating and updating tables, columns, relationships, and option sets using the Dataverse Web API.

## Features

This MCP server provides comprehensive tools for Dataverse schema management:

### Table Operations
- **create_dataverse_table** - Create new custom tables
- **get_dataverse_table** - Retrieve table metadata
- **update_dataverse_table** - Update table properties
- **delete_dataverse_table** - Delete custom tables
- **list_dataverse_tables** - List tables with filtering options

### Column Operations
- **create_dataverse_column** - Create columns of various types (see [Supported Column Types](#supported-column-types) below)
- **get_dataverse_column** - Retrieve column metadata
- **update_dataverse_column** - Update column properties
- **delete_dataverse_column** - Delete custom columns
- **list_dataverse_columns** - List columns for a table

### Relationship Operations
- **create_dataverse_relationship** - Create One-to-Many or Many-to-Many relationships
- **get_dataverse_relationship** - Retrieve relationship metadata
- **delete_dataverse_relationship** - Delete custom relationships
- **list_dataverse_relationships** - List relationships with filtering

### Option Set Operations
- **create_dataverse_optionset** - Create global option sets
- **get_dataverse_optionset** - Retrieve option set metadata
- **update_dataverse_optionset** - Update option sets (add/update/remove options)
- **delete_dataverse_optionset** - Delete custom option sets
- **list_dataverse_optionsets** - List option sets
- **get_dataverse_optionset_options** - Get options for a specific option set

## Supported Column Types

The MCP server supports all major Dataverse column types with comprehensive configuration options. The following table shows implementation status and testing verification:

| Column Type | Status | Tested | Description | Key Parameters |
|-------------|--------|--------|-------------|----------------|
| **String** | ✅ Implemented | ✅ Verified | Text fields with format options | `maxLength`, `format` (Email, Text, TextArea, Url, Phone) |
| **Integer** | ✅ Implemented | ✅ Verified | Whole numbers with constraints | `minValue`, `maxValue`, `defaultValue` |
| **Decimal** | ✅ Implemented | ⚠️ Not Tested | Decimal numbers with precision | `precision`, `minValue`, `maxValue`, `defaultValue` |
| **Money** | ✅ Implemented | ⚠️ Not Tested | Currency values | `precision`, `minValue`, `maxValue` |
| **Boolean** | ✅ Implemented | ✅ Verified | True/false with custom labels | `trueOptionLabel`, `falseOptionLabel`, `defaultValue` |
| **DateTime** | ✅ Implemented | ✅ Verified | Date and time fields | `dateTimeFormat` (DateOnly, DateAndTime) |
| **Picklist** | ✅ Implemented | ✅ Verified | Choice fields (local & global) | `options` (for local), `optionSetName` (for global) |
| **Lookup** | ✅ Implemented | ✅ Verified | References to other tables | `targetEntity` |
| **Memo** | ✅ Implemented | ⚠️ Not Tested | Long text fields | `maxLength` |
| **Double** | ✅ Implemented | ⚠️ Not Tested | Floating-point numbers | `precision`, `minValue`, `maxValue` |
| **BigInt** | ✅ Implemented | ⚠️ Not Tested | Large integer values | None |

### Column Type Details

#### String Columns ✅ Tested
- **Formats**: Email, Text, TextArea, Url, Phone
- **Max Length**: Configurable (default: 100)
- **Default Values**: Supported
- **Example**: Employee name, email address, phone number

#### Integer Columns ✅ Tested
- **Constraints**: Min/max value validation
- **Default Values**: Supported
- **Example**: Age, quantity, score with range 0-100

#### Boolean Columns ✅ Tested
- **Custom Labels**: Configurable true/false option labels
- **Default Values**: Supported
- **Example**: "Active/Inactive", "Yes/No", "Enabled/Disabled"

#### DateTime Columns ✅ Tested
- **DateOnly**: Date without time component (e.g., hire date, birthday)
- **DateAndTime**: Full timestamp with timezone handling (e.g., last login, created date)
- **Behavior**: Uses UserLocal timezone behavior

#### Picklist Columns ✅ Tested
- **Local Option Sets**: Create inline options with the column
- **Global Option Sets**: Reference existing global option sets by name
- **Color Support**: Options can have associated colors
- **Example**: Status (Active, Inactive), Priority (High, Medium, Low)

#### Lookup Columns ✅ Tested
- **Target Entity**: Specify which table to reference
- **Relationships**: Automatically creates underlying relationship
- **Example**: Customer lookup, Account reference

### Tested Column Scenarios

The following specific scenarios have been successfully tested and verified:

1. **String Column Creation** ✅
   - Basic text field with default settings
   - Email format validation
   - Custom max length constraints

2. **Integer Column Creation** ✅
   - Numeric field with min/max constraints (0-100 range)
   - Default value assignment

3. **Boolean Column Creation** ✅
   - Custom true/false labels ("Active"/"Inactive")
   - Default value configuration

4. **DateTime Column Creation** ✅
   - DateOnly format for hire dates
   - DateAndTime format for login timestamps

5. **Picklist Column Creation** ✅
   - Local option set with custom options
   - Global option set reference using existing "Colors" option set

6. **Lookup Column Creation** ✅
   - Cross-table reference (MCT Test 2 → MCT Test)
   - Automatic relationship creation

### Column Operations Status

| Operation | Status | Description |
|-----------|--------|-------------|
| **Create** | ✅ Fully Tested | All column types with type-specific parameters |
| **Read** | ✅ Implemented | Retrieve column metadata and configuration |
| **Update** | ✅ Implemented | Modify display name, description, required level |
| **Delete** | ✅ Tested | Remove custom columns from tables |
| **List** | ✅ Implemented | List all columns for a table with filtering |

## Prerequisites

1. **Dataverse Environment** - You need access to a Microsoft Dataverse environment
2. **Azure App Registration** - An Azure AD app registration with appropriate permissions
3. **Client Credentials** - Client ID, Client Secret, and Tenant ID for authentication

## Setup

### 1. Azure App Registration

1. Go to the [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Provide a name (e.g., "Dataverse MCP Server")
5. Select **Accounts in this organizational directory only**
6. Click **Register**

### 2. Create Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Provide a description and expiration
4. Click **Add**
5. **Copy the secret value immediately** (you won't be able to see it again)

### 3. Get Required Information

You'll need:
- **Tenant ID**: Found in Azure AD > Overview
- **Client ID**: Found in your app registration > Overview
- **Client Secret**: The secret you just created
- **Dataverse URL**: Your Dataverse environment URL (e.g., `https://yourorg.crm.dynamics.com`)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment configuration:
```bash
cp .env.example .env
```

3. Edit the `.env` file with your Dataverse credentials:
```bash
DATAVERSE_URL=https://yourorg.crm.dynamics.com
DATAVERSE_CLIENT_ID=your-client-id
DATAVERSE_CLIENT_SECRET=your-client-secret
DATAVERSE_TENANT_ID=your-tenant-id
```

4. Build the server:
```bash
npm run build
```

5. The server will be built to the `build/` directory with an executable `index.js` file.

## Configuration

The server supports flexible environment variable configuration with the following precedence (highest to lowest):

1. **MCP environment variables** (highest priority)
2. **System environment variables**
3. **`.env` file variables** (lowest priority)

### Option 1: Using .env file (Recommended for Development)

The server automatically loads environment variables from a `.env` file in the project root. This is the recommended approach for local development and testing.

1. Create your `.env` file:
```bash
cp .env.example .env
```

2. Add the following configuration to your MCP settings file:
```json
{
  "mcpServers": {
    "dataverse": {
      "command": "node",
      "args": ["/path/to/mcp-dataverse/build/index.js"]
    }
  }
}
```

### Option 2: Using MCP environment variables (Recommended for Production)

You can configure environment variables directly in the MCP settings. These will override any values in the `.env` file:

```json
{
  "mcpServers": {
    "dataverse": {
      "command": "node",
      "args": ["/path/to/mcp-dataverse/build/index.js"],
      "env": {
        "DATAVERSE_URL": "https://yourorg.crm.dynamics.com",
        "DATAVERSE_CLIENT_ID": "your-client-id",
        "DATAVERSE_CLIENT_SECRET": "your-client-secret",
        "DATAVERSE_TENANT_ID": "your-tenant-id"
      }
    }
  }
}
```

### Option 3: Hybrid Configuration

You can also use a combination approach where common settings are in `.env` and sensitive or environment-specific settings are overridden via MCP:

**.env file:**
```
DATAVERSE_URL=https://dev-org.crm.dynamics.com
DATAVERSE_TENANT_ID=common-tenant-id
```

**MCP settings (overrides for production):**
```json
{
  "mcpServers": {
    "dataverse": {
      "command": "node",
      "args": ["/path/to/mcp-dataverse/build/index.js"],
      "env": {
        "DATAVERSE_URL": "https://prod-org.crm.dynamics.com",
        "DATAVERSE_CLIENT_ID": "prod-client-id",
        "DATAVERSE_CLIENT_SECRET": "prod-client-secret"
      }
    }
  }
}
```

## Usage Examples

### Creating a Custom Table

```typescript
// Create a new custom table
await use_mcp_tool("dataverse", "create_dataverse_table", {
  logicalName: "new_project",
  displayName: "Project",
  displayCollectionName: "Projects",
  description: "Custom table for managing projects",
  ownershipType: "UserOwned",
  hasActivities: true,
  hasNotes: true,
  primaryNameAttribute: "new_name"
});
```

### Adding Columns to a Table

```typescript
// String column with email format
await use_mcp_tool("dataverse", "create_dataverse_column", {
  entityLogicalName: "new_project",
  logicalName: "new_email",
  displayName: "Contact Email",
  columnType: "String",
  format: "Email",
  maxLength: 100,
  requiredLevel: "ApplicationRequired"
});

// Integer column with constraints
await use_mcp_tool("dataverse", "create_dataverse_column", {
  entityLogicalName: "new_project",
  logicalName: "new_priority",
  displayName: "Priority Score",
  columnType: "Integer",
  minValue: 1,
  maxValue: 10,
  defaultValue: 5
});

// Boolean column with custom labels
await use_mcp_tool("dataverse", "create_dataverse_column", {
  entityLogicalName: "new_project",
  logicalName: "new_isactive",
  displayName: "Is Active",
  columnType: "Boolean",
  trueOptionLabel: "Active",
  falseOptionLabel: "Inactive",
  defaultValue: true
});

// DateTime column (date only)
await use_mcp_tool("dataverse", "create_dataverse_column", {
  entityLogicalName: "new_project",
  logicalName: "new_startdate",
  displayName: "Start Date",
  columnType: "DateTime",
  dateTimeFormat: "DateOnly",
  requiredLevel: "ApplicationRequired"
});

// DateTime column (date and time)
await use_mcp_tool("dataverse", "create_dataverse_column", {
  entityLogicalName: "new_project",
  logicalName: "new_lastmodified",
  displayName: "Last Modified",
  columnType: "DateTime",
  dateTimeFormat: "DateAndTime"
});

// Picklist column with local options
await use_mcp_tool("dataverse", "create_dataverse_column", {
  entityLogicalName: "new_project",
  logicalName: "new_status",
  displayName: "Status",
  columnType: "Picklist",
  options: [
    { value: 1, label: "Planning" },
    { value: 2, label: "In Progress" },
    { value: 3, label: "On Hold" },
    { value: 4, label: "Completed" }
  ]
});

// Picklist column using global option set
await use_mcp_tool("dataverse", "create_dataverse_column", {
  entityLogicalName: "new_project",
  logicalName: "new_color",
  displayName: "Project Color",
  columnType: "Picklist",
  optionSetName: "new_colors"
});

// Lookup column
await use_mcp_tool("dataverse", "create_dataverse_column", {
  entityLogicalName: "new_project",
  logicalName: "new_accountid",
  displayName: "Account",
  columnType: "Lookup",
  targetEntity: "account"
});

// Memo column for long text
await use_mcp_tool("dataverse", "create_dataverse_column", {
  entityLogicalName: "new_project",
  logicalName: "new_description",
  displayName: "Description",
  columnType: "Memo",
  maxLength: 2000,
  requiredLevel: "Recommended"
});
```

### Creating Relationships

```typescript
// Create a One-to-Many relationship
await use_mcp_tool("dataverse", "create_dataverse_relationship", {
  relationshipType: "OneToMany",
  schemaName: "new_account_project",
  referencedEntity: "account",
  referencingEntity: "new_project",
  referencingAttributeLogicalName: "new_accountid",
  referencingAttributeDisplayName: "Account",
  cascadeDelete: "RemoveLink"
});
```

### Managing Option Sets

```typescript
// Create a global option set
await use_mcp_tool("dataverse", "create_dataverse_optionset", {
  name: "new_priority",
  displayName: "Priority Levels",
  options: [
    { value: 1, label: "Low", color: "#00FF00" },
    { value: 2, label: "Medium", color: "#FFFF00" },
    { value: 3, label: "High", color: "#FF0000" }
  ]
});
```

## Authentication

The server uses **Client Credentials flow** (Server-to-Server authentication) with Azure AD. This provides:

- Secure authentication without user interaction
- Application-level permissions
- Suitable for automated scenarios
- Token refresh handling

## Error Handling

The server includes comprehensive error handling:

- **Authentication errors** - Invalid credentials or expired tokens
- **API errors** - Dataverse-specific error messages with codes
- **Validation errors** - Parameter validation and type checking
- **Network errors** - Connection and timeout handling

## Security Considerations

1. **Store secrets securely** - Never commit client secrets to version control
2. **Use environment variables** - Configure secrets through environment variables
3. **Principle of least privilege** - Grant only necessary permissions
4. **Monitor usage** - Track API calls and authentication attempts
5. **Rotate secrets regularly** - Update client secrets periodically

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify client ID, secret, and tenant ID
   - Check that the app registration is properly configured

2. **Permission Denied**
   - Verify that an application user has been created in Dataverse for your app registration
   - Check if the application user has appropriate security roles (e.g., System Administrator)
   - Ensure the application user is enabled and not disabled

3. **Entity Not Found**
   - Verify entity logical names are correct
   - Check if entities exist in the target environment

4. **Invalid Column Type**
   - Review supported column types in the documentation
   - Verify required parameters for specific column types

### Debug Mode

Set environment variable `DEBUG=true` for verbose logging:

```bash
DEBUG=true node build/index.js
```

## API Reference

For detailed parameter information for each tool, refer to the tool definitions in the source code:

- [`src/tools/table-tools.ts`](src/tools/table-tools.ts) - Table operations
- [`src/tools/column-tools.ts`](src/tools/column-tools.ts) - Column operations  
- [`src/tools/relationship-tools.ts`](src/tools/relationship-tools.ts) - Relationship operations
- [`src/tools/optionset-tools.ts`](src/tools/optionset-tools.ts) - Option set operations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review Dataverse Web API documentation
3. Create an issue in the repository