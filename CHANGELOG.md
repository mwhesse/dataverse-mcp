# Changelog

All notable changes to the Dataverse MCP Server project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.3]

### Added
- **Schema Export Relationships** - Added comprehensive relationship export functionality to `export_solution_schema` tool
  - Exports both OneToMany and ManyToMany relationships with complete metadata
  - Includes cascade configurations, entity references, and relationship properties
  - Uses improved filtering logic from relationship tools to avoid URI length limitations
  - Hybrid approach: basic server-side filtering with efficient client-side filtering using Set-based lookups
  - Properly filters relationships to only include those involving exported tables

### Enhanced
- **Mermaid Diagram Generation** - Enhanced `generate_mermaid_diagram` tool with major improvements
  - **Parameter Replacement**: Replaced `maxTablesPerDiagram` with flexible `tableNameFilter` array parameter
  - **Table Filtering**: Implemented case-insensitive table name matching with detailed logging
  - **Comprehensive Headers**: Added extensive header comments to generated Mermaid files including:
    - Tool parameters used for generation
    - Schema information (total tables, filtered tables, generation timestamp)
    - Usage instructions for various Mermaid-compatible tools
    - Complete regeneration command with exact parameters for AI context understanding
  - **Relationship Source Priority**: Updated Mermaid diagram tool to use only exported relationships from schema instead of inferring from lookup columns
  - **Eliminated Redundancy**: Removed lookup column relationship extraction logic that was creating duplicate or inferred relationships
  - **Improved Accuracy**: Now relies solely on actual Dataverse relationship metadata with proper cascade configurations
  - **Better Performance**: Removed complex lookup column analysis logic for more efficient diagram generation
  - **Enhanced Debugging**: Cleaner debug output showing only schema-based relationship processing
  - **Better Documentation**: Generated files now serve as self-documenting artifacts

### Technical Improvements
- **URI Length Handling**: Resolved 414 "URI Too Long" errors in relationship export by avoiding large filter queries
- **Performance Optimization**: Efficient Set-based client-side filtering for relationship matching
- **Enhanced Logging**: Comprehensive debug output for relationship filtering and diagram generation
- **AI Context**: Mermaid files now include complete context for AI tools to understand and regenerate diagrams

## [0.2.2]

### Fixed
- **Relationship Type Display Bug** - Fixed critical bug where OneToMany relationships were incorrectly displayed as ManyToMany
  - **Root Cause Analysis**: Identified two primary issues in the relationship filtering logic:
    1. **Incorrect Entity Filtering Logic**: Ternary operator incorrectly applied OneToMany filtering to all relationships when `relationshipType` was "All"
    2. **Unreliable Relationship Type Detection**: Using `RelationshipType` enum values instead of property-based detection
  - **Technical Implementation**:
    - Implemented proper Dataverse WebAPI cast syntax using `Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata` and `Microsoft.Dynamics.CRM.ManyToManyRelationshipMetadata`
    - Fixed entity filtering logic to properly handle "All" relationship types with separate API calls for each relationship type
    - Improved relationship type detection based on property presence (`'ReferencedEntity' in relationship`) rather than unreliable enum values
    - Enhanced entity filtering to work correctly with both OneToMany (`ReferencedEntity`/`ReferencingEntity`) and ManyToMany (`Entity1LogicalName`/`Entity2LogicalName`) properties
  - **API Improvements**: Used proper cast syntax with separate endpoints for different relationship types instead of relying on filtering
  - **Testing**: Comprehensive testing confirmed OneToMany relationships now correctly display as "OneToMany" instead of "ManyToMany"

- **Metadata API Parameter Support** - Removed unsupported `top` parameter from all metadata list operations
  - **Issue**: Dataverse metadata endpoints do not support the `top` parameter, causing API errors
  - **Resolution**: Removed `top` parameter from `list_dataverse_relationships`, `list_dataverse_tables`, and `list_dataverse_columns` tool schemas
  - **Impact**: All metadata operations now return complete result sets without artificial limits or API errors
  - **Files Modified**: Updated schemas in `relationship-tools.ts`, `table-tools.ts`, and `column-tools.ts`

### Technical Details
- **Enhanced Relationship Filtering**: Implemented separate API calls for OneToMany and ManyToMany relationships using proper Dataverse WebAPI cast syntax
- **Improved Type Detection**: Replaced unreliable enum-based detection with property-based relationship type identification
- **API Compliance**: Ensured all metadata operations use only supported query parameters
- **Comprehensive Testing**: Created test suite (`test/test-relationship-filtering-fix.cjs`) to verify the fix works correctly

## [0.2.1]

### Added
- **Mermaid Diagram Generation** - Professional Entity Relationship Diagram generation from exported schemas
  - `generate_mermaid_diagram` - Convert exported JSON schemas into visual Mermaid ERD diagrams
  - Complete relationship visualization with automatic detection from lookup column targets
  - Enhanced column markers with Primary Key (PK), Foreign Key (FK), Primary Name (PN), and NOT NULL indicators
  - Support for unlimited tables per diagram with optional splitting for large schemas
  - Professional diagram formatting with table names, column types, and relationship lines
  - Lookup column target display showing referenced tables (e.g., "Lookup (contact, account)")
  - Automatic relationship detection from both explicit schema relationships and lookup column targets
  - Mermaid-compatible syntax for use with Mermaid Live Editor, VS Code extensions, and documentation tools

- **Enhanced Schema Export** - Significant improvements to schema export functionality
  - **Multiple Customization Prefixes** - Support for exporting multiple publisher prefixes simultaneously
  - **Column Prefix Exclusion** - Filter out unwanted columns by prefix (default excludes: adx_, msa_, msdyn_, mspp_)
  - **Primary Key Column Inclusion** - Fixed critical bug ensuring all Primary Key columns are included in exports
  - **Improved System Table Filtering** - Better control over which system tables to include (contact, account by default)
  - **Enhanced Relationship Detection** - Improved lookup column target capture for accurate relationship mapping
  - **Parameter Rename** - Changed `includeSystemTables` to `includeAllSystemTables` for clarity

### Changed
- **Schema Export Tool Enhancements**
  - Renamed parameter from `includeSystemTables` to `includeAllSystemTables` with updated logic
  - Added `customizationPrefixes` array parameter to replace single prefix filtering
  - Added `excludeColumnPrefixes` parameter with sensible defaults for cleaner exports
  - Fixed column filtering logic to always include Primary Key columns regardless of system column settings
  - Improved debugging output for better troubleshooting of export issues

- **Mermaid Diagram Features**
  - Enhanced column markers with separate PK/FK indicators and descriptive attributes
  - Lookup columns now display target table names for better relationship understanding
  - Improved relationship detection algorithm with fallback mechanisms
  - Professional diagram formatting following Mermaid ERD best practices

### Fixed
- **Primary Key Column Export Bug** - Critical fix ensuring Primary Key columns are never excluded from schema exports
- **Column Prefix Filtering** - Fixed logic to prevent Primary Key columns from being filtered out by prefix exclusion rules
- **Relationship Detection** - Improved lookup column target detection for accurate relationship visualization
- **Mermaid Syntax Compliance** - Enhanced column marker formatting for better Mermaid diagram rendering

### Documentation
- **Windows MCP Configuration** - Added dedicated Windows setup section with cmd-based configuration examples
- **Mermaid Diagram Usage** - Comprehensive documentation for diagram generation with usage examples
- **Enhanced Schema Export Examples** - Updated examples showing new filtering and customization options

## [0.2.0]

### Added
- **Resource-Based Code Generation** - Major architectural improvement implementing MCP best practices
  - **WebAPI Resources** - Convert code generation tools to semantic resources for better LLM integration
    - `webapi://{operation}/{entitySetName?}/{entityId?}` - Generate Dataverse WebAPI calls with URI templates
    - `webapi-examples://{operation}/{entitySetName?}` - Common WebAPI patterns with best practices and comprehensive examples
    - Support for all operations: retrieve, retrieveMultiple, create, update, delete, associate, disassociate, callAction, callFunction
    - Dynamic parameter completion for operations and entity names
    - Multiple output formats: HTTP requests, cURL commands, and JavaScript fetch examples
  
  - **PowerPages Resources** - PowerPages-specific code generation as resources
    - `powerpages://{operation}/{entityName?}/{entityId?}` - Generate PowerPages API calls with proper `/_api/` endpoints
    - `powerpages-examples://{operation}/{entityName?}` - PowerPages patterns with React components and authentication
    - `powerpages-auth://patterns` - Comprehensive authentication and user context patterns for PowerPages
    - Request verification token handling and PowerPages-specific security patterns
    - React component examples with hooks, state management, and error handling

- **Resource Architecture Benefits**
  - **Semantic Clarity** - Code generation is now data access (resources) vs operations (tools)
  - **Better LLM Integration** - Resources can be loaded into context for code generation tasks
  - **URI-Based Access** - Intuitive patterns like `webapi://retrieve/accounts/123e4567-e89b-12d3-a456-426614174000`
  - **Template Support** - Dynamic URI templates with parameter completion and validation
  - **Backward Compatibility** - All existing tools continue to work alongside new resources

### Changed
- **MCP SDK Upgrade** - Updated `@modelcontextprotocol/sdk` from `^1.0.0` to `^1.17.0`
  - Access to latest MCP features including enhanced resource support
  - Improved ResourceTemplate functionality with completion support
  - Better parameter handling and URI template processing

- **Code Generation Architecture** - Transitioned from tool-based to resource-based approach
  - Tools now reserved for operations with side effects (CRUD, file operations)
  - Resources provide data and code examples without side effects
  - Maintains full backward compatibility with existing tool-based workflows

### Technical Details
- **Resource Implementation** - New resource files in `src/resources/`
  - `webapi-resources.ts` - Dataverse WebAPI code generation resources
  - `powerpages-resources.ts` - PowerPages-specific code generation resources
  - Comprehensive parameter validation and error handling
  - Support for array parameter conversion and template processing

- **Testing Infrastructure** - Enhanced testing for resource functionality
  - `test/test-resources.cjs` - Comprehensive resource functionality testing
  - `test/test-simple-resource.cjs` - Basic resource access verification
  - Validation of URI template processing and parameter handling

### Documentation
- **Migration Guide** - Added `RESOURCE_MIGRATION.md` with comprehensive migration documentation
  - Detailed explanation of resource vs tool architecture
  - Usage examples for all new resources
  - Migration impact and backward compatibility information
  - Future enhancement roadmap

## [0.1.10]

### Added
- **PowerPages Configuration Management** - Comprehensive tool for managing PowerPages Code Site configurations
  - `manage_powerpages_webapi_config` - Manage table permissions and WebAPI site settings for PowerPages Code Sites
  - Automated YAML file management for `.powerpages-site` directory structure including sitesetting.yml, webrole.yml, and table-permissions/*.yml files
  - Configuration status checking with comprehensive overview of WebAPI enablement, web roles, and table permissions
  - WebAPI configuration management for enabling/disabling table access with field-level control
  - Granular table permission creation with CRUD operations (read, create, write, delete) and scope management (Global, Contact, Account, Self, Parent)
  - Configuration listing with detailed breakdown of site settings, web roles, and table permissions
  - PowerPages Code Site integration with standard directory structure support
  - Complete workflow examples from status checking to WebAPI usage with step-by-step configuration process

- **PowerPages Configuration Features**
  - **YAML Automation**: Automatic creation and updates of PowerPages configuration files
  - **Status Monitoring**: Comprehensive configuration status with visual indicators and detailed summaries
  - **Permission Management**: Fine-grained table permissions with web role integration
  - **WebAPI Enablement**: Table-specific WebAPI configuration with field-level access control
  - **Integration Ready**: Seamless integration with PowerPages WebAPI Generator for end-to-end development workflow
  - **Developer Friendly**: Clear configuration examples and real-world usage scenarios with credit card table demonstrations

### Changed
- Updated README.md with comprehensive PowerPages Configuration Management documentation
- Added PowerPages Configuration Management section to table of contents and features list
- Enhanced API reference to include powerpages-config-tools.ts
- Added detailed configuration examples showing various operation types and workflows
- Updated project structure documentation to include PowerPages configuration management tools

## [0.1.9]

### Added
- **PowerPages WebAPI Generator** - Specialized tool for PowerPages Single Page Applications (SPAs)
  - `generate_powerpages_webapi_call` - Generate PowerPages-specific WebAPI calls using `/_api/[logicalEntityName]` format
  - Support for core operations: retrieve, retrieveMultiple, create, update, delete optimized for PowerPages environments
  - Request verification token handling for secure POST/PATCH/DELETE operations with `__RequestVerificationToken` header
  - PowerPages authentication context integration with user information access patterns
  - React component examples with hooks, state management, and error handling for modern SPA development
  - JavaScript fetch examples optimized for browser-based PowerPages applications
  - Custom header support for advanced PowerPages scenarios and API versioning
  - OData query support with proper URL encoding for PowerPages WebAPI endpoints
  - Authentication token management with PowerPages-specific token retrieval patterns

- **PowerPages Generator Features**
  - **PowerPages URL Format**: Correct `/_api/[logicalEntityName]` endpoint construction for PowerPages SPAs
  - **Security Integration**: Request verification token and PowerPages authentication context handling
  - **React-Ready Examples**: Complete React component examples with modern hooks and patterns
  - **SPA Optimization**: Designed specifically for single-page application development in PowerPages
  - **Error Handling**: Comprehensive error handling patterns for PowerPages browser environments
  - **Authentication Helpers**: PowerPages user context access and token management utilities

## [0.1.8]

### Added
- **WebAPI Call Generator** - Comprehensive tool for generating Dataverse WebAPI calls
  - `generate_webapi_call` - Generate complete HTTP requests with URLs, headers, and request bodies
  - Support for all major operations: retrieve, retrieveMultiple, create, update, delete, associate, disassociate, callAction, callFunction
  - Advanced OData query support: $select, $filter, $orderby, $top, $skip, $expand, $count with proper URL encoding
  - Professional header management including Content-Type, Accept, OData headers, solution context, and authentication placeholders
  - Multiple output formats: HTTP request format, cURL commands, and JavaScript fetch examples
  - Solution context integration with automatic MSCRM.SolutionUniqueName header inclusion
  - Support for complex filtering expressions with proper encoding (e.g., contains, startswith, and logical operators)
  - Conditional update headers (If-Match, If-None-Match) and prefer headers for enhanced API control
  - Impersonation support via MSCRMCallerID header
  - Comprehensive parameter validation and error handling

- **WebAPI Generator Features**
  - **Complete Request Generation**: Produces ready-to-use HTTP requests with method, URL, headers, and body
  - **Multi-Format Output**: Provides HTTP format, cURL commands, and JavaScript fetch examples for different use cases
  - **OData Query Building**: Handles complex query construction with proper URL encoding and parameter validation
  - **Solution Awareness**: Automatically includes current solution context headers for proper customization tracking
  - **Developer Friendly**: Includes detailed operation information and usage examples for learning and debugging
  - **Enterprise Ready**: Supports all Dataverse operations including bound/unbound actions and functions

### Changed
- Updated README.md with comprehensive WebAPI call generator documentation and usage examples
- Added WebAPI Call Generator section to table of contents and features list
- Enhanced API reference to include webapi-tools.ts
- Added detailed examples showing various query patterns for contacts and other entities
- Updated project structure documentation to include new WebAPI tools

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