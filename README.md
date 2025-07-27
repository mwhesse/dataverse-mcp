# Dataverse MCP Server

A Model Context Protocol (MCP) server for Microsoft Dataverse that enables schema operations including creating and updating tables, columns, relationships, and option sets using the Dataverse Web API.

## Table of Contents

- [Features](#features)
  - [Table Operations](#table-operations)
  - [Column Operations](#column-operations)
  - [Relationship Operations](#relationship-operations)
  - [Option Set Operations](#option-set-operations)
  - [Solution & Publisher Operations](#solution--publisher-operations)
  - [Security Role Operations](#security-role-operations)
  - [Team Operations](#team-operations)
  - [Business Unit Operations](#business-unit-operations)
  - [Schema Export Operations](#schema-export-operations)
- [Solution-Based Architecture](#solution-based-architecture)
  - [Key Benefits](#key-benefits)
  - [Solution Workflow](#solution-workflow)
  - [Example: XYZ Organization Setup](#example-xyz-organization-setup)
  - [Persistent Solution Context](#persistent-solution-context)
- [Supported Column Types](#supported-column-types)
  - [Column Type Details](#column-type-details)
  - [Tested Column Scenarios](#tested-column-scenarios)
  - [Column Operations Status](#column-operations-status)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
  - [1. Azure App Registration](#1-azure-app-registration)
  - [2. Create Client Secret](#2-create-client-secret)
  - [3. Create Application User in Dataverse](#3-create-application-user-in-dataverse)
  - [4. Get Required Information](#4-get-required-information)
- [Installation](#installation)
- [Configuration](#configuration)
  - [Option 1: Using .env file (Recommended for Development)](#option-1-using-env-file-recommended-for-development)
  - [Option 2: Using MCP environment variables (Recommended for Production)](#option-2-using-mcp-environment-variables-recommended-for-production)
  - [Option 3: Hybrid Configuration](#option-3-hybrid-configuration)
- [Usage Examples](#usage-examples)
  - [Creating a Custom Table](#creating-a-custom-table)
  - [Adding Columns to a Table](#adding-columns-to-a-table)
  - [Creating Relationships](#creating-relationships)
  - [Managing Option Sets](#managing-option-sets)
  - [Managing Security Roles](#managing-security-roles)
  - [Managing Teams](#managing-teams)
  - [Managing Business Units](#managing-business-units)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)
  - [Common Issues](#common-issues)
  - [Debug Mode](#debug-mode)
- [API Reference](#api-reference)
- [Solution Management Best Practices](#solution-management-best-practices)
  - [Publisher Configuration](#publisher-configuration)
  - [Solution Context Management](#solution-context-management)
  - [Environment Promotion](#environment-promotion)
  - [Git Integration](#git-integration)
- [Contributing](#contributing)
- [Releasing](#releasing)
  - [Creating a Release](#creating-a-release)
  - [Automated GitHub Releases](#automated-github-releases)
  - [Manual Release Process](#manual-release-process)
- [Changelog](#changelog)
- [License](#license)
- [Support](#support)

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

### Solution & Publisher Operations
- **create_dataverse_publisher** - Create custom publishers with prefixes
- **get_dataverse_publisher** - Retrieve publisher metadata
- **list_dataverse_publishers** - List publishers with filtering
- **create_dataverse_solution** - Create solutions linked to publishers
- **get_dataverse_solution** - Retrieve solution metadata
- **list_dataverse_solutions** - List solutions with publisher details
- **set_solution_context** - Set active solution for schema operations
- **get_solution_context** - View current solution context
- **clear_solution_context** - Remove solution context

### Security Role Operations
- **create_dataverse_role** - Create new security roles
- **get_dataverse_role** - Retrieve security role metadata
- **update_dataverse_role** - Update security role properties
- **delete_dataverse_role** - Delete custom security roles
- **list_dataverse_roles** - List security roles with filtering options
- **add_privileges_to_role** - Add privileges to a security role
- **remove_privilege_from_role** - Remove privileges from a security role
- **replace_role_privileges** - Replace all privileges for a security role
- **get_role_privileges** - Retrieve all privileges for a security role
- **assign_role_to_user** - Assign security roles to users
- **remove_role_from_user** - Remove security roles from users
- **assign_role_to_team** - Assign security roles to teams
- **remove_role_from_team** - Remove security roles from teams

### Team Operations
- **create_dataverse_team** - Create new teams with various types and configurations
- **get_dataverse_team** - Retrieve team metadata and details
- **update_dataverse_team** - Update team properties and settings
- **delete_dataverse_team** - Delete teams
- **list_dataverse_teams** - List teams with filtering options
- **add_members_to_team** - Add users as team members
- **remove_members_from_team** - Remove users from teams
- **get_team_members** - Retrieve all members of a team
- **convert_owner_team_to_access_team** - Convert owner teams to access teams

### Business Unit Operations
- **create_dataverse_businessunit** - Create new business units with comprehensive address and contact information
- **get_dataverse_businessunit** - Retrieve business unit metadata and details
- **update_dataverse_businessunit** - Update business unit properties, addresses, and settings
- **delete_dataverse_businessunit** - Delete business units
- **list_dataverse_businessunits** - List business units with filtering and sorting options
- **get_businessunit_hierarchy** - Retrieve the hierarchical structure of business units
- **set_businessunit_parent** - Change the parent business unit in the hierarchy
- **get_businessunit_users** - Get users associated with a business unit (with subsidiary option)
- **get_businessunit_teams** - Get teams associated with a business unit (with subsidiary option)

### Schema Export Operations
- **export_solution_schema** - Export solution schema to JSON file including tables, columns, and global option sets. Supports filtering by customization prefix to export only solution-specific entities. **Note: Relationship export is not yet implemented.**

## Solution-Based Architecture

The MCP server implements enterprise-grade solution management following Microsoft Dataverse best practices.

### Key Benefits

- **Professional Schema Naming**: Uses publisher-based customization prefixes
- **Solution Association**: All schema changes are automatically associated with the active solution
- **ALM Support**: Enables proper solution packaging and deployment across environments
- **Persistent Context**: Solution context survives server restarts via `.mcp-dataverse` file
- **Enterprise Governance**: Supports multiple publishers and solutions with proper isolation

### Solution Workflow

1. **Create Publisher**: Define your organization's customization prefix
2. **Create Solution**: Link solution to publisher for schema organization
3. **Set Context**: Activate solution for subsequent operations
4. **Create Schema**: All tables, columns, and option sets use the publisher's prefix automatically
5. **Deploy**: Export solution for deployment to other environments

### Example: XYZ Organization Setup

```typescript
// 1. Create publisher with "xyz" prefix
await use_mcp_tool("dataverse", "create_dataverse_publisher", {
  friendlyName: "XYZ Test Publisher",
  uniqueName: "xyzpublisher",
  customizationPrefix: "xyz",
  customizationOptionValuePrefix: 20000,
  description: "Publisher for XYZ organization"
});

// 2. Create solution linked to publisher
await use_mcp_tool("dataverse", "create_dataverse_solution", {
  friendlyName: "XYZ Test Solution",
  uniqueName: "xyzsolution",
  publisherUniqueName: "xyzpublisher",
  description: "Main solution for XYZ customizations"
});

// 3. Set solution context (persisted across server restarts)
await use_mcp_tool("dataverse", "set_solution_context", {
  solutionUniqueName: "xyzsolution"
});

// 4. Create schema objects - they automatically use "xyz" prefix
await use_mcp_tool("dataverse", "create_dataverse_table", {
  logicalName: "xyz_project",        // Uses xyz prefix automatically
  displayName: "XYZ Project",
  displayCollectionName: "XYZ Projects"
});

await use_mcp_tool("dataverse", "create_dataverse_column", {
  entityLogicalName: "xyz_project",
  logicalName: "xyz_description",    // Uses xyz prefix automatically
  displayName: "Description",
  columnType: "Memo"
});
```

### Persistent Solution Context

The server automatically persists solution context to a `.mcp-dataverse` file in the project root:

```json
{
  "solutionUniqueName": "xyzsolution",
  "solutionDisplayName": "XYZ Test Solution",
  "publisherUniqueName": "xyzpublisher",
  "publisherDisplayName": "XYZ Test Publisher",
  "customizationPrefix": "xyz",
  "lastUpdated": "2025-07-26T08:27:56.966Z"
}
```

**Benefits of Persistence:**
- **No Context Loss**: Solution context survives server restarts
- **Instant Productivity**: Developers can immediately continue work
- **Consistent Prefixes**: No need to remember and re-set solution context
- **Team Isolation**: Each developer can have their own solution context (file is git-ignored)

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
   - Cross-table reference (MCP Test 2 → MCP Test)
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

### 3. Create Application User in Dataverse

**Critical Step**: You must create an Application User in your Dataverse environment and assign appropriate permissions.

1. **Navigate to Dataverse Admin Center**
   - Go to [Power Platform Admin Center](https://admin.powerplatform.microsoft.com)
   - Select your environment
   - Go to **Settings** > **Users + permissions** > **Application users**

2. **Create Application User**
   - Click **+ New app user**
   - Click **+ Add an app**
   - Search for and select your Azure app registration (by Client ID)
   - Enter a **Business unit** (usually the root business unit)
   - Click **Create**

3. **Assign Security Roles**
   - Select the newly created application user
   - Click **Manage roles**
   - Assign appropriate security roles based on your needs:
     - **System Administrator**: Full access (recommended for development/testing)
     - **System Customizer**: Schema operations without data access
     - **Custom Role**: Create specific permissions for production use

4. **Verify Application User Status**
   - Ensure the application user is **Enabled**
   - Verify it shows as **Application** type (not **User**)
   - Note the **Application ID** matches your Azure app registration Client ID

### 4. Get Required Information

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

2. Build the server:
```bash
npm run build
```

3. Copy the full path to the built `index.js` file:
   - The server will be built to the `build/` directory
   - Copy the complete file path (e.g., `/Users/yourname/path/to/mcp-dataverse/build/index.js`)
   - You'll use this path in your MCP configuration file

4. Configure the MCP server in your MCP settings file using the copied path (see [Configuration](#configuration) section below for details)

## Configuration

The server supports flexible environment variable configuration with the following precedence (highest to lowest):

1. **MCP environment variables** (highest priority)
2. **System environment variables**
3. **`.env` file variables** (lowest priority)

### Option 1: Using .env file (Recommended for MCP Server Development)

The server automatically loads environment variables from a `.env` file in the project root. This is the recommended approach when contributing to or modifying the MCP server itself.

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
      "args": ["/path/to/mcp-dataverse/build/index.js"],
      "disabled": false,
      "alwaysAllow": [],
      "disabledTools": [],
      "timeout": 900
    }
  }
}
```

**Note**: The `timeout` setting is increased to 900 seconds (15 minutes) to accommodate longer-running operations like schema export, which may need to process large amounts of metadata.

### Option 2: Using MCP environment variables (Recommended for Normal Usage)

You can configure environment variables directly in the MCP settings. This is the recommended approach for normal usage when using the MCP Dataverse tool for development activities. These will override any values in the `.env` file:

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
      },
      "disabled": false,
      "alwaysAllow": [],
      "disabledTools": [],
      "timeout": 900
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
      },
      "disabled": false,
      "alwaysAllow": [],
      "disabledTools": [],
      "timeout": 900
    }
  }
}
```

## Usage Examples

### Creating a Custom Table

```typescript
// Create a new custom table with automatic naming
// The system automatically generates:
// - Logical Name: xyz_project (using customization prefix from solution context)
// - Schema Name: xyz_Project (prefix lowercase, original case preserved, spaces removed)
// - Display Collection Name: Projects (auto-pluralized)
// - Primary Name Attribute: xyz_project_name
await use_mcp_tool("dataverse", "create_dataverse_table", {
  displayName: "Project",
  description: "Custom table for managing projects",
  ownershipType: "UserOwned",
  hasActivities: true,
  hasNotes: true
});

// Example with minimal parameters (most common usage)
await use_mcp_tool("dataverse", "create_dataverse_table", {
  displayName: "Customer Feedback"
});
// This creates:
// - Logical Name: xyz_customerfeedback
// - Schema Name: xyz_CustomerFeedback (prefix lowercase, original case preserved)
// - Display Collection Name: Customer Feedbacks
// - Primary Name Attribute: xyz_customerfeedback_name
```

**Important**: Before creating tables, ensure you have set a solution context using `set_solution_context` to provide the customization prefix. The system automatically uses the prefix from the active solution's publisher.

### Adding Columns to a Table

```typescript
// String column with email format and automatic naming
// The system automatically generates:
// - Logical Name: xyz_contactemail (prefix + lowercase, no spaces)
// - Schema Name: xyz_ContactEmail (prefix lowercase, original case preserved)
await use_mcp_tool("dataverse", "create_dataverse_column", {
  entityLogicalName: "xyz_project",
  displayName: "Contact Email",
  columnType: "String",
  format: "Email",
  maxLength: 100,
  requiredLevel: "ApplicationRequired"
});

// Integer column with constraints (generates xyz_priorityscore)
await use_mcp_tool("dataverse", "create_dataverse_column", {
  entityLogicalName: "xyz_project",
  displayName: "Priority Score",
  columnType: "Integer",
  minValue: 1,
  maxValue: 10,
  defaultValue: 5
});

// Boolean column with custom labels (generates xyz_isactive)
await use_mcp_tool("dataverse", "create_dataverse_column", {
  entityLogicalName: "xyz_project",
  displayName: "Is Active",
  columnType: "Boolean",
  trueOptionLabel: "Active",
  falseOptionLabel: "Inactive",
  defaultValue: true
});

// DateTime column (date only) (generates xyz_startdate)
await use_mcp_tool("dataverse", "create_dataverse_column", {
  entityLogicalName: "xyz_project",
  displayName: "Start Date",
  columnType: "DateTime",
  dateTimeFormat: "DateOnly",
  requiredLevel: "ApplicationRequired"
});

// DateTime column (date and time) (generates xyz_lastmodified)
await use_mcp_tool("dataverse", "create_dataverse_column", {
  entityLogicalName: "xyz_project",
  displayName: "Last Modified",
  columnType: "DateTime",
  dateTimeFormat: "DateAndTime"
});

// Picklist column with local options (generates xyz_status)
await use_mcp_tool("dataverse", "create_dataverse_column", {
  entityLogicalName: "xyz_project",
  displayName: "Status",
  columnType: "Picklist",
  options: [
    { value: 1, label: "Planning" },
    { value: 2, label: "In Progress" },
    { value: 3, label: "On Hold" },
    { value: 4, label: "Completed" }
  ]
});

// Picklist column using global option set (generates xyz_projectcolor)
await use_mcp_tool("dataverse", "create_dataverse_column", {
  entityLogicalName: "xyz_project",
  displayName: "Project Color",
  columnType: "Picklist",
  optionSetName: "xyz_colors"
});

// Lookup column (generates xyz_account)
await use_mcp_tool("dataverse", "create_dataverse_column", {
  entityLogicalName: "xyz_project",
  displayName: "Account",
  columnType: "Lookup",
  targetEntity: "account"
});

// Memo column for long text (generates xyz_description)
await use_mcp_tool("dataverse", "create_dataverse_column", {
  entityLogicalName: "xyz_project",
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

### Managing Security Roles

```typescript
// Create a new security role
await use_mcp_tool("dataverse", "create_dataverse_role", {
  name: "Project Manager",
  description: "Role for project managers with specific permissions",
  appliesTo: "Project management team members",
  isAutoAssigned: false,
  isInherited: "1",
  summaryOfCoreTablePermissions: "Read/Write access to project-related tables"
});

// Get security role information
await use_mcp_tool("dataverse", "get_dataverse_role", {
  roleId: "role-guid-here"
});

// List security roles
await use_mcp_tool("dataverse", "list_dataverse_roles", {
  customOnly: true,
  includeManaged: false,
  top: 20
});

// Add privileges to a role
await use_mcp_tool("dataverse", "add_privileges_to_role", {
  roleId: "role-guid-here",
  privileges: [
    { privilegeId: "privilege-guid-1", depth: "Global" },
    { privilegeId: "privilege-guid-2", depth: "Local" }
  ]
});

// Assign role to a user
await use_mcp_tool("dataverse", "assign_role_to_user", {
  roleId: "role-guid-here",
  userId: "user-guid-here"
});

// Assign role to a team
await use_mcp_tool("dataverse", "assign_role_to_team", {
  roleId: "role-guid-here",
  teamId: "team-guid-here"
});

// Get role privileges
await use_mcp_tool("dataverse", "get_role_privileges", {
  roleId: "role-guid-here"
});
```

### Managing Teams

```typescript
// Create a new team
await use_mcp_tool("dataverse", "create_dataverse_team", {
  name: "Development Team",
  description: "Team for software development activities",
  administratorId: "admin-user-guid-here",
  teamType: "0", // Owner team
  membershipType: "0", // Members and guests
  emailAddress: "devteam@company.com"
});

// Get team information
await use_mcp_tool("dataverse", "get_dataverse_team", {
  teamId: "team-guid-here"
});

// List teams with filtering
await use_mcp_tool("dataverse", "list_dataverse_teams", {
  teamType: "0", // Owner teams only
  excludeDefault: true,
  top: 20
});

// Add members to a team
await use_mcp_tool("dataverse", "add_members_to_team", {
  teamId: "team-guid-here",
  memberIds: ["user-guid-1", "user-guid-2", "user-guid-3"]
});

// Get team members
await use_mcp_tool("dataverse", "get_team_members", {
  teamId: "team-guid-here"
});

// Remove members from a team
await use_mcp_tool("dataverse", "remove_members_from_team", {
  teamId: "team-guid-here",
  memberIds: ["user-guid-1", "user-guid-2"]
});

// Update team properties
await use_mcp_tool("dataverse", "update_dataverse_team", {
  teamId: "team-guid-here",
  name: "Updated Development Team",
  description: "Updated description for the development team",
  emailAddress: "newdevteam@company.com"
});

// Convert owner team to access team
await use_mcp_tool("dataverse", "convert_owner_team_to_access_team", {
  teamId: "owner-team-guid-here"
});
```

### Managing Business Units

```typescript
// Create a new business unit with comprehensive information
await use_mcp_tool("dataverse", "create_dataverse_businessunit", {
  name: "Sales Division",
  description: "Business unit for sales operations",
  divisionName: "Sales",
  emailAddress: "sales@company.com",
  costCenter: "SALES-001",
  creditLimit: 100000,
  parentBusinessUnitId: "parent-bu-guid-here",
  // Address information
  address1_name: "Sales Office",
  address1_line1: "123 Business Street",
  address1_city: "New York",
  address1_stateorprovince: "NY",
  address1_postalcode: "10001",
  address1_country: "United States",
  address1_telephone1: "+1-555-0123",
  address1_fax: "+1-555-0124",
  // Website and other details
  webSiteUrl: "https://sales.company.com",
  stockExchange: "NYSE",
  tickerSymbol: "COMP"
});

// Get business unit information
await use_mcp_tool("dataverse", "get_dataverse_businessunit", {
  businessUnitId: "business-unit-guid-here"
});

// List business units with filtering
await use_mcp_tool("dataverse", "list_dataverse_businessunits", {
  filter: "isdisabled eq false",
  orderby: "name asc",
  top: 20
});

// Update business unit properties
await use_mcp_tool("dataverse", "update_dataverse_businessunit", {
  businessUnitId: "business-unit-guid-here",
  name: "Updated Sales Division",
  description: "Updated description for sales operations",
  emailAddress: "newsales@company.com",
  creditLimit: 150000,
  // Update address information
  address1_line1: "456 New Business Avenue",
  address1_telephone1: "+1-555-9999"
});

// Get business unit hierarchy
await use_mcp_tool("dataverse", "get_businessunit_hierarchy", {
  businessUnitId: "business-unit-guid-here"
});

// Change business unit parent (reorganization)
await use_mcp_tool("dataverse", "set_businessunit_parent", {
  businessUnitId: "child-bu-guid-here",
  parentBusinessUnitId: "new-parent-bu-guid-here"
});

// Get users in a business unit
await use_mcp_tool("dataverse", "get_businessunit_users", {
  businessUnitId: "business-unit-guid-here",
  includeSubsidiaryUsers: false // Set to true to include users from child business units
});

// Get teams in a business unit
await use_mcp_tool("dataverse", "get_businessunit_teams", {
  businessUnitId: "business-unit-guid-here",
  includeSubsidiaryTeams: true // Include teams from subsidiary business units
});

// Delete a business unit (ensure no dependencies exist)
await use_mcp_tool("dataverse", "delete_dataverse_businessunit", {
  businessUnitId: "business-unit-guid-here"
});
```

### Exporting Solution Schema

```typescript
// Export custom schema only (default settings)
// Exports tables, columns, and option sets to a JSON file
// Note: Relationship export is not yet implemented
await use_mcp_tool("dataverse", "export_solution_schema", {
  outputPath: "my-solution-schema.json"
});

// Export with system entities included for comprehensive documentation
await use_mcp_tool("dataverse", "export_solution_schema", {
  outputPath: "complete-schema.json",
  includeSystemTables: true,
  includeSystemColumns: true,
  includeSystemOptionSets: true
});

// Export minified JSON for production use
await use_mcp_tool("dataverse", "export_solution_schema", {
  outputPath: "schema-minified.json",
  prettify: false
});

// Export to specific directory with custom settings
await use_mcp_tool("dataverse", "export_solution_schema", {
  outputPath: "exports/solution-backup.json",
  includeSystemTables: false,
  includeSystemColumns: false,
  includeSystemOptionSets: false,
  prettify: true
});

// Export only tables matching solution customization prefix
await use_mcp_tool("dataverse", "export_solution_schema", {
  outputPath: "prefix-only-schema.json",
  includeSystemTables: false,
  includeSystemColumns: false,
  includeSystemOptionSets: false,
  prefixOnly: true,
  prettify: true
});
```

**Schema Export Features:**
- **Schema Capture**: Exports tables, columns, and global option sets (relationships not yet implemented)
- **Flexible Filtering**: Choose to include or exclude system entities
- **Solution Context Aware**: Automatically includes solution metadata when context is set
- **Comprehensive Metadata**: Captures all entity properties and column types
- **JSON Format**: Human-readable or minified output options
- **Directory Creation**: Automatically creates output directories if they don't exist

**Example Output Structure:**
```json
{
  "metadata": {
    "exportedAt": "2025-07-26T17:30:00.000Z",
    "solutionUniqueName": "xyzsolution",
    "solutionDisplayName": "XYZ Test Solution",
    "publisherPrefix": "xyz",
    "includeSystemTables": false,
    "includeSystemColumns": false,
    "includeSystemOptionSets": false
  },
  "tables": [
    {
      "logicalName": "xyz_project",
      "displayName": "Project",
      "schemaName": "xyz_Project",
      "ownershipType": "UserOwned",
      "isCustomEntity": true,
      "columns": [
        {
          "logicalName": "xyz_name",
          "displayName": "Name",
          "attributeType": "String",
          "maxLength": 100,
          "isPrimaryName": true
        }
      ]
    }
  ],
  "globalOptionSets": [
    {
      "name": "xyz_priority",
      "displayName": "Priority Levels",
      "isGlobal": true,
      "options": [
        { "value": 1, "label": "Low" },
        { "value": 2, "label": "High" }
      ]
    }
  ]
}
```

**Note**: Relationship export functionality is planned for a future release.

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
   - **Verify Application User Exists**: Check that an application user has been created in Dataverse for your app registration
   - **Check Security Roles**: Ensure the application user has appropriate security roles:
     - **System Administrator**: Required for full schema operations
     - **System Customizer**: Minimum for table/column operations
     - **Environment Maker**: May be needed for solution operations
   - **Verify User Status**: Ensure the application user is enabled and not disabled
   - **Check Business Unit**: Verify the application user is assigned to the correct business unit
   - **Validate Client ID**: Confirm the Application ID in Dataverse matches your Azure app registration Client ID

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
- [`src/tools/solution-tools.ts`](src/tools/solution-tools.ts) - Solution and publisher operations
- [`src/tools/role-tools.ts`](src/tools/role-tools.ts) - Security role operations
- [`src/tools/team-tools.ts`](src/tools/team-tools.ts) - Team operations
- [`src/tools/businessunit-tools.ts`](src/tools/businessunit-tools.ts) - Business unit operations
- [`src/tools/schema-tools.ts`](src/tools/schema-tools.ts) - Schema export operations

## Solution Management Best Practices

### Publisher Configuration

When creating publishers, follow these guidelines:

- **Unique Prefixes**: Use 2-8 character prefixes that identify your organization
- **Option Value Ranges**: Use non-overlapping ranges (e.g., 10000-19999 for one publisher, 20000-29999 for another)
- **Descriptive Names**: Use clear, professional names for publishers and solutions

### Solution Context Management

```typescript
// Check current context
await use_mcp_tool("dataverse", "get_solution_context", {});

// Switch to different solution
await use_mcp_tool("dataverse", "set_solution_context", {
  solutionUniqueName: "anothersolution"
});

// Clear context (removes persistence file)
await use_mcp_tool("dataverse", "clear_solution_context", {});
```

### Environment Promotion

1. **Development**: Create and test schema changes in dev environment with solution context
2. **Export**: Use Power Platform CLI or admin center to export solution
3. **Import**: Deploy solution to test/production environments
4. **Validation**: Verify all customizations use proper prefixes

### Git Integration

The `.mcp-dataverse` file is automatically excluded from version control:

```gitignore
# MCP Dataverse context file
.mcp-dataverse
```

This allows each developer to maintain their own solution context while preventing accidental sharing of environment-specific settings.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Changelog

For a detailed history of changes, new features, and bug fixes, see the [CHANGELOG.md](CHANGELOG.md) file.

### Recent Updates

- **v0.1.2**: Added comprehensive Security Role Management system with 13 new tools
- **v0.1.1**: Introduced Solution-Based Architecture with persistent context
- **v0.1.0**: Initial release with core table, column, relationship, and option set operations

The changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format and includes:
- **Added**: New features and capabilities
- **Changed**: Modifications to existing functionality
- **Fixed**: Bug fixes and corrections
- **Security**: Security-related updates

## Releasing

This project includes automated release scripts for maintainers:

### Creating a Release

```bash
# Patch release (0.1.0 -> 0.1.1)
npm run release

# Minor release (0.1.0 -> 0.2.0)
npm run release:minor

# Major release (0.1.0 -> 1.0.0)
npm run release:major
```

These scripts will:
1. Build the project
2. Bump the version in `package.json`
3. Create a git tag
4. Push the changes and tag to GitHub

### Automated GitHub Releases

When a tag is pushed to GitHub, the GitHub Actions workflow will automatically:
1. Build the project
2. Create release archives (`.tar.gz` and `.zip`)
3. Create a GitHub release with the archives attached
4. Include installation instructions in the release notes

### Manual Release Process

If you prefer to create releases manually:

1. Build the project: `npm run build`
2. Update version: `npm version [patch|minor|major]`
3. Push changes: `git push && git push --tags`
4. The GitHub Actions workflow will handle the rest

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review Dataverse Web API documentation
3. Create an issue in the repository