# Changelog

All notable changes to the Dataverse MCP Server project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.7]

### Added
- **Schema Export Operations** - Complete solution schema export functionality
  - `export_solution_schema` - Export complete solution schema to JSON file including tables, columns, global option sets, and relationships
  - Comprehensive schema capture with all entity properties, column types, and relationship configurations
  - Flexible filtering options to include or exclude system entities, columns, and option sets
  - Solution context awareness - automatically includes solution metadata when context is set
  - JSON output options: human-readable (pretty-printed) or minified format
  - Automatic directory creation for output paths
  - Detailed export statistics and metadata including export timestamp and solution information

- **Schema Export Features**
  - **Complete Metadata Capture**: Exports all table definitions, column configurations, global option sets, and relationship metadata
  - **System Entity Support**: Optional inclusion of system tables, columns, and option sets for comprehensive documentation
  - **Solution Integration**: Automatically captures solution context including publisher prefix and solution details
  - **Flexible Output**: Configurable JSON formatting (pretty-printed or minified) and custom output paths
  - **Export Statistics**: Detailed summary of exported entities with file size and export metadata
  - **Enterprise Ready**: Supports large schema exports with efficient metadata retrieval

### Changed
- Updated README.md with comprehensive schema export documentation and usage examples
- Added schema export operations to table of contents and features section
- Enhanced API reference to include schema-tools.ts
- Added detailed schema export examples showing various configuration options
- Updated project structure documentation to include test folder organization

## [0.1.6]

### Changed
- **Improved Table Creation** - Enhanced `create_dataverse_table` tool with automatic naming conventions
  - Removed manual `logicalName` and `displayCollectionName` parameters
  - Automatic logical name generation using customization prefix from solution context (e.g., "Test Table" → "xyz_testtable")
  - Automatic schema name generation preserving original case (e.g., "Test Table" → "xyz_TestTable", prefix lowercase, spaces removed)
  - Automatic display collection name generation with smart pluralization (e.g., "Test Table" → "Test Tables")
  - Automatic primary name attribute generation (e.g., "xyz_testtable_name")
  - Requires active solution context to provide customization prefix

- **Improved Column Creation** - Enhanced `create_dataverse_column` tool with automatic naming conventions
  - Removed manual `logicalName` parameter from column creation
  - Automatic logical name generation using customization prefix from solution context (e.g., "Customer Email" → "xyz_customeremail")
  - Automatic schema name generation preserving original case (e.g., "Customer Email" → "xyz_CustomerEmail", prefix lowercase, spaces removed)
  - Consistent naming conventions with table creation for unified developer experience
  - Requires active solution context to provide customization prefix

## [0.1.5]

### Added
- **Business Unit Management System** - Complete business unit operations with 9 comprehensive tools
  - `create_dataverse_businessunit` - Create business units with comprehensive address and contact information
  - `get_dataverse_businessunit` - Retrieve detailed business unit metadata and configuration
  - `update_dataverse_businessunit` - Update business unit properties, addresses, and organizational settings
  - `delete_dataverse_businessunit` - Delete business units with proper dependency handling
  - `list_dataverse_businessunits` - List business units with advanced filtering and sorting options
  - `get_businessunit_hierarchy` - Retrieve hierarchical structure and relationships between business units
  - `set_businessunit_parent` - Change parent business unit for organizational restructuring
  - `get_businessunit_users` - Get users associated with business units (with subsidiary inclusion option)
  - `get_businessunit_teams` - Get teams associated with business units (with subsidiary inclusion option)

- **Comprehensive Business Unit Features**
  - Full address management (Address 1 and Address 2) with geographic coordinates
  - Contact information including phone, fax, email, and website details
  - Financial information with cost center and credit limit tracking
  - Organizational details including division name and stock exchange information
  - Hierarchical business unit structure with parent-child relationships
  - Integration with user and team management systems
  - Support for Microsoft Dataverse business unit hierarchy functions

### Changed
- Updated README.md with comprehensive business unit operations documentation
- Added business unit management examples and usage patterns
- Enhanced API reference to include businessunit-tools.ts
- Updated table of contents to include Business Unit Operations section
- Updated table creation documentation to reflect new automatic naming conventions

## [0.1.4]

### Added
- **Team Management System** - Complete team operations with 9 comprehensive tools
  - `create_dataverse_team` - Create teams with various types and configurations
  - `get_dataverse_team` - Retrieve detailed team information
  - `update_dataverse_team` - Update team properties and settings
  - `delete_dataverse_team` - Delete teams
  - `list_dataverse_teams` - List teams with advanced filtering
  - `add_members_to_team` - Add users as team members
  - `remove_members_from_team` - Remove users from teams
  - `get_team_members` - Retrieve all members of a team
  - `convert_owner_team_to_access_team` - Convert owner teams to access teams

## [0.1.3]

### Added
- **Security Role Operations** - Complete security role management system
  - `create_dataverse_role` - Create new security roles with full configuration
  - `get_dataverse_role` - Retrieve detailed security role information
  - `update_dataverse_role` - Update security role properties
  - `delete_dataverse_role` - Delete custom security roles
  - `list_dataverse_roles` - List security roles with advanced filtering
  - `add_privileges_to_role` - Add privileges to roles with access levels
  - `remove_privilege_from_role` - Remove specific privileges from roles
  - `replace_role_privileges` - Replace all privileges for a role
  - `get_role_privileges` - Retrieve all privileges assigned to a role
  - `assign_role_to_user` - Assign security roles to users
  - `remove_role_from_user` - Remove security roles from users
  - `assign_role_to_team` - Assign security roles to teams
  - `remove_role_from_team` - Remove security roles from teams
- Comprehensive testing suite for role operations
- Project changelog following Keep a Changelog format

### Changed
- Updated documentation with team and security role operations
- Enhanced installation instructions for better clarity
- Added comprehensive usage examples for team management
- Updated API reference to include team-tools.ts

## [0.1.2]

- **Release Automation**
  - NPM release scripts for patch, minor, and major versions
  - GitHub Actions workflow for automated releases
  - Automatic archive creation (.tar.gz and .zip)
  - Release notes generation with installation instructions

- **Documentation Enhancements**
  - Added Security Role Operations section to README
  - Updated table of contents with new sections
  - Added comprehensive usage examples for role management
  - Updated API reference to include role-tools.ts
  - Added release documentation with usage instructions

- **Testing Infrastructure**
  - Comprehensive test suite for role operations
  - Multiple test scripts for different scenarios
  - Automated testing of role creation, listing, and filtering
  - Integration testing with solution context

### Changed
- **Installation Process**
  - Removed .env file creation from installation steps
  - Updated instructions to copy full path of built index.js
  - Clarified configuration options for development vs production use
  - Enhanced MCP configuration examples

- **Configuration Documentation**
  - Clarified "Development" vs "Production" terminology
  - "Development" now refers to contributing to the MCP server itself
  - "Production" now refers to normal usage of the MCP Dataverse tool
  - Updated configuration examples with better explanations

### Fixed
- GitHub Actions workflow permissions for release creation
- Updated to modern GitHub CLI approach for releases
- Improved error handling in role creation operations

## [0.1.1]

### Added
- **Solution-Based Architecture** - Enterprise-grade solution management
  - Persistent solution context via `.mcp-dataverse` file
  - Automatic customization prefix handling
  - Solution context survives server restarts
  - Publisher-based schema naming conventions

- **Solution & Publisher Operations**
  - `create_dataverse_publisher` - Create custom publishers with prefixes
  - `get_dataverse_publisher` - Retrieve publisher metadata
  - `list_dataverse_publishers` - List publishers with filtering
  - `create_dataverse_solution` - Create solutions linked to publishers
  - `get_dataverse_solution` - Retrieve solution metadata
  - `list_dataverse_solutions` - List solutions with publisher details
  - `set_solution_context` - Set active solution for schema operations
  - `get_solution_context` - View current solution context
  - `clear_solution_context` - Remove solution context

- **Enhanced Column Support**
  - Comprehensive testing of all column types
  - Support for String, Integer, Boolean, DateTime, Picklist, and Lookup columns
  - Local and global option set support for Picklist columns
  - Advanced column configuration options

### Changed
- All schema operations now automatically use solution context
- Schema objects automatically receive publisher customization prefixes
- Enhanced error messages with better context

### Fixed
- Column creation with proper type-specific parameters
- Relationship creation with correct cascade behaviors
- Option set creation with color support

## [0.1.0]

### Added
- **Initial Release** - Core Dataverse MCP Server functionality
- **Table Operations**
  - `create_dataverse_table` - Create new custom tables
  - `get_dataverse_table` - Retrieve table metadata
  - `update_dataverse_table` - Update table properties
  - `delete_dataverse_table` - Delete custom tables
  - `list_dataverse_tables` - List tables with filtering options

- **Column Operations**
  - `create_dataverse_column` - Create columns of various types
  - `get_dataverse_column` - Retrieve column metadata
  - `update_dataverse_column` - Update column properties
  - `delete_dataverse_column` - Delete custom columns
  - `list_dataverse_columns` - List columns for a table

- **Relationship Operations**
  - `create_dataverse_relationship` - Create One-to-Many or Many-to-Many relationships
  - `get_dataverse_relationship` - Retrieve relationship metadata
  - `delete_dataverse_relationship` - Delete custom relationships
  - `list_dataverse_relationships` - List relationships with filtering

- **Option Set Operations**
  - `create_dataverse_optionset` - Create global option sets
  - `get_dataverse_optionset` - Retrieve option set metadata
  - `update_dataverse_optionset` - Update option sets (add/update/remove options)
  - `delete_dataverse_optionset` - Delete custom option sets
  - `list_dataverse_optionsets` - List option sets
  - `get_dataverse_optionset_options` - Get options for a specific option set

- **Core Infrastructure**
  - DataverseClient with OAuth2 authentication
  - Comprehensive error handling and logging
  - TypeScript implementation with Zod validation
  - MCP SDK integration
  - Environment variable configuration
  - Flexible authentication options (.env file or MCP environment variables)

- **Documentation**
  - Comprehensive README with setup instructions
  - Azure App Registration guide
  - Application User creation instructions
  - Usage examples for all operations
  - Troubleshooting guide
  - API reference documentation

### Technical Details
- Built with TypeScript and MCP SDK
- Uses Dataverse Web API v9.2
- OAuth2 Client Credentials flow authentication
- Automatic token refresh handling
- Support for both managed and unmanaged customizations
- OData query support for filtering and pagination

---

## Release Notes Format

Each release includes:
- **Added**: New features and capabilities
- **Changed**: Changes to existing functionality
- **Fixed**: Bug fixes and corrections
- **Removed**: Deprecated or removed features
- **Security**: Security-related changes

## Version Numbering

This project follows [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality additions
- **PATCH** version for backwards-compatible bug fixes

## Contributing

When contributing to this project, please:
1. Update the [Unreleased] section with your changes
2. Follow the established format for changelog entries
3. Include relevant details about new features or breaking changes
4. Update version numbers according to semantic versioning principles