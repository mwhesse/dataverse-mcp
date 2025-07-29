# Resource Migration Guide

This document explains the migration from tools to resources for code generation functionality in the MCP Dataverse server.

## Overview

With the upgrade to MCP SDK 1.17.0, we've implemented a more semantic approach to code generation by converting appropriate tools to resources. This aligns with MCP best practices where:

- **Tools** perform operations with side effects (CRUD operations, file modifications)
- **Resources** provide data and information (code examples, documentation)

## What Changed

### Converted to Resources

The following tools have been converted to resources because they generate code examples rather than perform operations:

1. **`generate_webapi_call` tool** → **WebAPI Resources**
2. **`generate_powerpages_webapi_call` tool** → **PowerPages Resources**

### Remain as Tools

These tools continue to exist because they perform actual operations:

- All CRUD operations (`create_dataverse_table`, `update_dataverse_table`, etc.)
- `export_solution_schema` (writes files to disk)
- `manage_powerpages_webapi_config` (modifies project files)
- Solution context management tools

## New Resource Structure

### WebAPI Resources

#### 1. WebAPI Call Generator
- **URI Pattern**: `webapi://{operation}/{entitySetName?}/{entityId?}`
- **Examples**:
  - `webapi://retrieve/accounts/123e4567-e89b-12d3-a456-426614174000`
  - `webapi://retrieveMultiple/contacts`
  - `webapi://create/accounts`
  - `webapi://update/accounts/123e4567-e89b-12d3-a456-426614174000`

#### 2. WebAPI Examples
- **URI Pattern**: `webapi-examples://{operation}/{entitySetName?}`
- **Examples**:
  - `webapi-examples://retrieve/accounts`
  - `webapi-examples://retrieveMultiple/contacts`

### PowerPages Resources

#### 1. PowerPages WebAPI Generator
- **URI Pattern**: `powerpages://{operation}/{entityName?}/{entityId?}`
- **Examples**:
  - `powerpages://retrieve/contacts/123e4567-e89b-12d3-a456-426614174000`
  - `powerpages://retrieveMultiple/contacts`
  - `powerpages://create/contacts`

#### 2. PowerPages Examples
- **URI Pattern**: `powerpages-examples://{operation}/{entityName?}`
- **Examples**:
  - `powerpages-examples://retrieve/contacts`
  - `powerpages-examples://retrieveMultiple/contacts`

#### 3. PowerPages Authentication Patterns
- **URI**: `powerpages-auth://patterns`
- **Description**: Common authentication and user context patterns for PowerPages

## Benefits of the Resource Approach

### 1. Better Semantic Clarity
- Code generation is now treated as data access rather than action execution
- Clear distinction between operations (tools) and information (resources)

### 2. Improved LLM Workflows
- Resources can be loaded into context for code generation tasks
- Multiple related code examples can be referenced simultaneously
- Better integration with LLM reasoning about code patterns

### 3. URI-Based Access
- Intuitive URI patterns for accessing specific code examples
- Template-based completion support
- Consistent naming conventions

### 4. Enhanced Discoverability
- Resources support completion hints for operations and entity names
- Structured approach to code example organization

## Usage Examples

### Accessing WebAPI Resources

```javascript
// Get a retrieve operation example
const retrieveExample = await client.readResource({
  uri: 'webapi://retrieve/accounts/123e4567-e89b-12d3-a456-426614174000'
});

// Get multiple records example
const listExample = await client.readResource({
  uri: 'webapi://retrieveMultiple/contacts'
});

// Get comprehensive examples for an operation
const examples = await client.readResource({
  uri: 'webapi-examples://create/accounts'
});
```

### Accessing PowerPages Resources

```javascript
// Get PowerPages-specific API call
const powerPagesExample = await client.readResource({
  uri: 'powerpages://retrieveMultiple/contacts'
});

// Get authentication patterns
const authPatterns = await client.readResource({
  uri: 'powerpages-auth://patterns'
});

// Get operation-specific examples with React components
const reactExamples = await client.readResource({
  uri: 'powerpages-examples://retrieveMultiple/contacts'
});
```

## Migration Impact

### For Existing Users
- **Backward Compatibility**: All existing tools continue to work
- **New Functionality**: Additional resource-based access to code examples
- **No Breaking Changes**: Existing tool-based workflows remain functional

### For New Users
- **Recommended Approach**: Use resources for code generation, tools for operations
- **Better UX**: More intuitive access to code examples through URI patterns
- **Enhanced Integration**: Better support for LLM-based development workflows

## Implementation Details

### Resource Registration
Resources are registered in dedicated files:
- `src/resources/webapi-resources.ts` - WebAPI code generation resources
- `src/resources/powerpages-resources.ts` - PowerPages code generation resources

### Template Support
Resources support URI templates with:
- Parameter completion hints
- Dynamic content generation based on URI parameters
- Flexible parameter handling (arrays converted to strings)

### Content Types
Resources return appropriate MIME types:
- `text/plain` for raw code examples
- `text/markdown` for formatted documentation and examples

## Testing

The implementation includes comprehensive tests:
- `test/test-resources.cjs` - Full resource functionality testing
- `test/test-simple-resource.cjs` - Basic resource access verification

Run tests with:
```bash
npm run build
node test/test-resources.cjs
node test/test-simple-resource.cjs
```

## Future Enhancements

Potential future improvements:
1. **Schema-aware completion** - Dynamic entity and field suggestions based on current Dataverse schema
2. **Context-aware examples** - Code examples that adapt to current solution context
3. **Interactive templates** - Resources that generate code based on multiple parameters
4. **Documentation resources** - Comprehensive API documentation as resources

## Conclusion

The migration to resources for code generation provides a more semantic, discoverable, and LLM-friendly approach to accessing code examples while maintaining full backward compatibility with existing tool-based workflows.