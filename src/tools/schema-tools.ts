import { z } from 'zod';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DataverseClient } from '../dataverse-client.js';
import * as fs from 'fs';
import * as path from 'path';

// Schema for the export_solution_schema tool
export const exportSolutionSchemaSchema = z.object({
  outputPath: z.string().optional().describe('Path where to save the schema JSON file (default: schema-export.json)'),
  includeAllSystemTables: z.boolean().optional().default(false).describe('Whether to include all system tables in the export'),
  includeSystemColumns: z.boolean().optional().default(false).describe('Whether to include system columns in the export'),
  includeSystemOptionSets: z.boolean().optional().default(false).describe('Whether to include system option sets in the export'),
  includeSystemRelationships: z.boolean().optional().default(false).describe('Whether to include system (non-custom) relationships in the export'),
  prefixOnly: z.boolean().optional().default(false).describe('Whether to export only tables that match the solution customization prefix (deprecated - use customizationPrefixes instead)'),
  customizationPrefixes: z.array(z.string()).optional().describe('List of customization prefixes to include (e.g., ["new", "xyz", "its"]). If not provided and prefixOnly is true, uses solution context prefix'),
  systemTablesToInclude: z.array(z.string()).optional().default(['contact', 'account']).describe('List of system tables to include when includeAllSystemTables is false (default: contact, account)'),
  excludeColumnPrefixes: z.array(z.string()).optional().default(['adx_', 'msa_', 'msdyn_', 'mspp_']).describe('List of column prefixes to exclude from export (default: ["adx_", "msa_", "msdyn_", "mspp_"])'),
  prettify: z.boolean().optional().default(true).describe('Whether to format the JSON output for readability')
});

// Schema for the generate_mermaid_diagram tool
export const generateMermaidDiagramSchema = z.object({
  schemaPath: z.string().describe('Path to the exported JSON schema file'),
  outputPath: z.string().optional().describe('Path where to save the Mermaid diagram file (default: schema-diagram.mmd)'),
  includeColumns: z.boolean().optional().default(true).describe('Whether to include column details in the diagram'),
  includeRelationships: z.boolean().optional().default(true).describe('Whether to include relationships in the diagram'),
  tableNameFilter: z.array(z.string()).optional().describe('List of table logical names to include in the diagram. If not specified, all tables will be included.')
});

// Types for the schema export
interface TableSchema {
  logicalName: string;
  displayName: string;
  displayCollectionName: string;
  description?: string;
  schemaName: string;
  ownershipType: string;
  hasActivities: boolean;
  hasNotes: boolean;
  isAuditEnabled: boolean;
  isDuplicateDetectionEnabled: boolean;
  isValidForQueue: boolean;
  isConnectionsEnabled: boolean;
  isMailMergeEnabled: boolean;
  isDocumentManagementEnabled: boolean;
  isCustomEntity: boolean;
  isManaged: boolean;
  primaryNameAttribute: string;
  primaryIdAttribute: string;
  columns: ColumnSchema[];
}

interface ColumnSchema {
  logicalName: string;
  displayName: string;
  description?: string;
  schemaName: string;
  attributeType: string;
  requiredLevel: string;
  isAuditEnabled: boolean;
  isValidForAdvancedFind: boolean;
  isValidForCreate: boolean;
  isValidForUpdate: boolean;
  isCustomAttribute: boolean;
  isManaged: boolean;
  isPrimaryId: boolean;
  isPrimaryName: boolean;
  maxLength?: number;
  format?: string;
  minValue?: number;
  maxValue?: number;
  precision?: number;
  dateTimeFormat?: string;
  defaultValue?: any;
  targetEntity?: string;
  targets?: string[]; // Array of target entity logical names for Lookup columns
  optionSet?: OptionSetSchema;
}

interface OptionSetSchema {
  name?: string;
  displayName: string;
  description?: string;
  isGlobal: boolean;
  isCustomOptionSet: boolean;
  isManaged: boolean;
  options: OptionSchema[];
}

interface OptionSchema {
  value: number;
  label: string;
  description?: string;
  color?: string;
}

interface RelationshipSchema {
  schemaName: string;
  relationshipType: string;
  referencedEntity?: string;
  referencingEntity?: string;
  referencingAttribute?: string;
  entity1LogicalName?: string;
  entity2LogicalName?: string;
  intersectEntityName?: string;
  cascadeConfiguration?: any;
  isCustomRelationship: boolean;
  isManaged: boolean;
}

interface SolutionSchema {
  metadata: {
    exportedAt: string;
    solutionUniqueName?: string;
    solutionDisplayName?: string;
    solutionVersion?: string;
    publisherPrefix?: string;
    includeAllSystemTables: boolean;
    includeSystemColumns: boolean;
    includeSystemOptionSets: boolean;
    includeSystemRelationships: boolean;
    prefixOnly: boolean;
    customizationPrefixes?: string[];
    systemTablesToInclude: string[];
    excludeColumnPrefixes: string[];
  };
  tables: TableSchema[];
  globalOptionSets: OptionSetSchema[];
  relationships: RelationshipSchema[];
}

export async function exportSolutionSchema(
  client: DataverseClient,
  args: z.infer<typeof exportSolutionSchemaSchema>
): Promise<string> {
  try {
    const {
      outputPath = 'schema-export.json',
      includeAllSystemTables,
      includeSystemColumns,
      includeSystemOptionSets,
      includeSystemRelationships,
      prefixOnly,
      customizationPrefixes,
      systemTablesToInclude = ['contact', 'account'],
      excludeColumnPrefixes = ['adx_', 'msa_', 'msdyn_', 'mspp_'],
      prettify
    } = args;
    
    // Collect debug messages to return in response
    const debugMessages: string[] = [];
    const log = (message: string) => {
      console.log(message);
      debugMessages.push(message);
    };
    
    // Get solution context if available
    const solutionContext = client.getSolutionContext();
    
    log('Starting schema export...');
    
    // Initialize the schema object
    const schema: SolutionSchema = {
      metadata: {
        exportedAt: new Date().toISOString(),
        includeAllSystemTables,
        includeSystemColumns,
        includeSystemOptionSets,
        includeSystemRelationships,
        prefixOnly,
        customizationPrefixes,
        systemTablesToInclude,
        excludeColumnPrefixes
      },
      tables: [],
      globalOptionSets: [],
      relationships: []
    };

    // Add solution context to metadata if available
    if (solutionContext) {
      schema.metadata.solutionUniqueName = solutionContext.solutionUniqueName;
      schema.metadata.solutionDisplayName = solutionContext.solutionDisplayName;
      schema.metadata.publisherPrefix = solutionContext.customizationPrefix;
    }

    // Export global option sets
    log('Exporting global option sets...');
    try {
      // Get all option sets (filtering is not supported on GlobalOptionSetDefinitions)
      log('Retrieving all global option sets...');
      const optionSetsListResponse = await client.getMetadata(`GlobalOptionSetDefinitions`);
      log(`Found ${optionSetsListResponse.value.length} total option sets`);
      
      for (const optionSetInfo of optionSetsListResponse.value) {
        log(`Processing option set: ${optionSetInfo.Name} (IsCustom: ${optionSetInfo.IsCustomOptionSet}, IsManaged: ${optionSetInfo.IsManaged})`);
        
        // Apply system/custom filtering
        if (!includeSystemOptionSets && !optionSetInfo.IsCustomOptionSet) {
          log(`Skipping system option set ${optionSetInfo.Name}`);
          continue;
        }
        
        // Apply prefix filtering if enabled
        const prefixesToCheck = customizationPrefixes || (prefixOnly && solutionContext?.customizationPrefix ? [solutionContext.customizationPrefix] : []);
        if (prefixesToCheck.length > 0) {
          const optionSetName = optionSetInfo.Name.toLowerCase();
          const matchesPrefix = prefixesToCheck.some(prefix => optionSetName.startsWith(prefix.toLowerCase() + '_'));
          if (!matchesPrefix) {
            log(`Skipping option set ${optionSetInfo.Name} (doesn't match any prefix: ${prefixesToCheck.join(', ')})`);
            continue;
          }
          log(`Including option set ${optionSetInfo.Name} (matches prefix filter)`);
        }
        
        log(`Exporting option set: ${optionSetInfo.Name}`);
        
        try {
          // Get detailed option set information including options
          // Try multiple approaches to get the full option set metadata
          let optionSet = null;
          let optionsFound = false;
          
          // Approach 1: Try with MetadataId
          try {
            log(`Trying to get option set ${optionSetInfo.Name} using MetadataId ${optionSetInfo.MetadataId}`);
            const response1 = await client.getMetadata(`GlobalOptionSetDefinitions(${optionSetInfo.MetadataId})`);
            optionSet = response1;
            if (optionSet.Options && optionSet.Options.length > 0) {
              optionsFound = true;
              log(`Successfully got options using MetadataId approach`);
            }
          } catch (error1) {
            log(`MetadataId approach failed: ${error1 instanceof Error ? error1.message : 'Unknown error'}`);
          }
          
          // Approach 2: Try with Name filter if first approach didn't get options
          if (!optionsFound) {
            try {
              log(`Trying to get option set ${optionSetInfo.Name} using Name filter`);
              const response2 = await client.getMetadata(`GlobalOptionSetDefinitions?$filter=Name eq '${optionSetInfo.Name}'`);
              if (response2.value && response2.value.length > 0) {
                const foundOptionSet = response2.value[0];
                if (foundOptionSet.Options && foundOptionSet.Options.length > 0) {
                  optionSet = foundOptionSet;
                  optionsFound = true;
                  log(`Successfully got options using Name filter approach`);
                }
              }
            } catch (error2) {
              log(`Name filter approach failed: ${error2 instanceof Error ? error2.message : 'Unknown error'}`);
            }
          }
          
          // If we still don't have an option set, use what we have from the first approach
          if (!optionSet) {
            log(`No option set retrieved, skipping ${optionSetInfo.Name}`);
            continue;
          }
          
          log(`Retrieved detailed info for ${optionSet.Name}, has ${optionSet.Options?.length || 0} options`);
          
          const optionSetSchema: OptionSetSchema = {
            name: optionSet.Name,
            displayName: optionSet.DisplayName?.UserLocalizedLabel?.Label || optionSet.Name,
            description: optionSet.Description?.UserLocalizedLabel?.Label,
            isGlobal: true,
            isCustomOptionSet: optionSet.IsCustomOptionSet,
            isManaged: optionSet.IsManaged,
            options: []
          };

          // Export options for this option set
          if (optionSet.Options && optionSet.Options.length > 0) {
            for (const option of optionSet.Options) {
              const optionSchema: OptionSchema = {
                value: option.Value,
                label: option.Label?.UserLocalizedLabel?.Label || `Option ${option.Value}`,
                description: option.Description?.UserLocalizedLabel?.Label,
                color: option.Color
              };
              optionSetSchema.options.push(optionSchema);
            }
            log(`Added ${optionSetSchema.options.length} options to ${optionSet.Name}`);
          }

          schema.globalOptionSets.push(optionSetSchema);
          log(`Successfully added option set ${optionSet.Name} to schema`);
        } catch (optionSetError) {
          log(`Error processing option set ${optionSetInfo.Name}: ${optionSetError instanceof Error ? optionSetError.message : 'Unknown error'}`);
        }
      }
      log(`Completed option set export. Total exported: ${schema.globalOptionSets.length}`);
    } catch (error) {
      log(`Warning: Could not export global option sets: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Full error:', error);
    }

    // Export tables
    log('Exporting tables...');
    
    // Build table filter based on system table inclusion logic
    let tablesFilter = '';
    if (includeAllSystemTables) {
      // Include all tables (both custom and system)
      tablesFilter = '';
      log('Including all system tables (no filter applied)');
    } else if (systemTablesToInclude.length > 0) {
      // Include custom tables and specified system tables only
      const systemTableFilter = systemTablesToInclude.map(table => `LogicalName eq '${table}'`).join(' or ');
      tablesFilter = `IsCustomEntity eq true or (${systemTableFilter})`;
      log(`Using filter: ${tablesFilter}`);
    } else {
      // Only custom tables
      tablesFilter = 'IsCustomEntity eq true';
      log(`Using filter: ${tablesFilter}`);
    }
    
    const tablesUrl = tablesFilter
      ? `EntityDefinitions?$filter=${tablesFilter}&$select=LogicalName,DisplayName,DisplayCollectionName,Description,SchemaName,OwnershipType,HasActivities,HasNotes,IsAuditEnabled,IsDuplicateDetectionEnabled,IsValidForQueue,IsConnectionsEnabled,IsMailMergeEnabled,IsDocumentManagementEnabled,IsCustomEntity,IsManaged,PrimaryNameAttribute,PrimaryIdAttribute`
      : `EntityDefinitions?$select=LogicalName,DisplayName,DisplayCollectionName,Description,SchemaName,OwnershipType,HasActivities,HasNotes,IsAuditEnabled,IsDuplicateDetectionEnabled,IsValidForQueue,IsConnectionsEnabled,IsMailMergeEnabled,IsDocumentManagementEnabled,IsCustomEntity,IsManaged,PrimaryNameAttribute,PrimaryIdAttribute`;
    const tablesResponse = await client.getMetadata(tablesUrl);
    
    for (const table of tablesResponse.value) {
      // Apply prefix filtering if enabled
      const prefixesToCheck = customizationPrefixes || (prefixOnly && solutionContext?.customizationPrefix ? [solutionContext.customizationPrefix] : []);
      
      if (table.IsCustomEntity) {
        // Custom table - apply prefix filtering if specified
        if (prefixesToCheck.length > 0) {
          const tableName = table.LogicalName.toLowerCase();
          const matchesPrefix = prefixesToCheck.some(prefix => tableName.startsWith(prefix.toLowerCase() + '_'));
          if (!matchesPrefix) {
            log(`Skipping custom table ${table.LogicalName} (doesn't match any prefix: ${prefixesToCheck.join(', ')})`);
            continue;
          }
          log(`Including custom table ${table.LogicalName} (matches prefix filter)`);
        } else {
          log(`Including custom table ${table.LogicalName} (no prefix filter)`);
        }
      } else {
        // System table - check inclusion logic
        if (includeAllSystemTables) {
          log(`Including system table ${table.LogicalName} (includeAllSystemTables is true)`);
        } else {
          // Should only be here if it was explicitly included in the filter
          // Double-check it's in our allowed list (defensive programming)
          if (!systemTablesToInclude.includes(table.LogicalName.toLowerCase())) {
            log(`Skipping system table ${table.LogicalName} (not in systemTablesToInclude list)`);
            continue;
          }
          log(`Including system table ${table.LogicalName} (in systemTablesToInclude list)`);
        }
      }
      
      log(`Exporting table: ${table.LogicalName}`);
      
      const tableSchema: TableSchema = {
        logicalName: table.LogicalName,
        displayName: table.DisplayName?.UserLocalizedLabel?.Label || table.LogicalName,
        displayCollectionName: table.DisplayCollectionName?.UserLocalizedLabel?.Label || table.LogicalName,
        description: table.Description?.UserLocalizedLabel?.Label,
        schemaName: table.SchemaName,
        ownershipType: table.OwnershipType === 1 ? 'UserOwned' : 'OrganizationOwned',
        hasActivities: table.HasActivities,
        hasNotes: table.HasNotes,
        isAuditEnabled: table.IsAuditEnabled,
        isDuplicateDetectionEnabled: table.IsDuplicateDetectionEnabled,
        isValidForQueue: table.IsValidForQueue,
        isConnectionsEnabled: table.IsConnectionsEnabled,
        isMailMergeEnabled: table.IsMailMergeEnabled,
        isDocumentManagementEnabled: table.IsDocumentManagementEnabled,
        isCustomEntity: table.IsCustomEntity,
        isManaged: table.IsManaged,
        primaryNameAttribute: table.PrimaryNameAttribute,
        primaryIdAttribute: table.PrimaryIdAttribute,
        columns: []
      };

      // Export columns for this table - Remove $select to get all properties including Targets
      // Always include Primary Key columns (IsPrimaryId eq true) even when system columns are excluded
      const columnsFilter = includeSystemColumns
        ? ''
        : 'IsCustomAttribute eq true or IsPrimaryId eq true';
      const columnsUrl = columnsFilter
        ? `EntityDefinitions(LogicalName='${table.LogicalName}')/Attributes?$filter=${columnsFilter}`
        : `EntityDefinitions(LogicalName='${table.LogicalName}')/Attributes`;
      const columnsResponse = await client.getMetadata(columnsUrl);
      
      for (const column of columnsResponse.value) {
        // Apply column prefix exclusion filtering, but never exclude Primary Key columns
        const columnName = column.LogicalName.toLowerCase();
        const shouldExcludeColumn = !column.IsPrimaryId && excludeColumnPrefixes.some(prefix =>
          columnName.startsWith(prefix.toLowerCase())
        );
        
        if (shouldExcludeColumn) {
          log(`    Excluding column ${column.LogicalName} (matches exclusion prefix)`);
          continue;
        }
        
        const columnSchema: ColumnSchema = {
          logicalName: column.LogicalName,
          displayName: column.DisplayName?.UserLocalizedLabel?.Label || column.LogicalName,
          description: column.Description?.UserLocalizedLabel?.Label,
          schemaName: column.SchemaName,
          attributeType: column.AttributeType,
          requiredLevel: column.RequiredLevel?.Value || 'None',
          isAuditEnabled: column.IsAuditEnabled,
          isValidForAdvancedFind: column.IsValidForAdvancedFind,
          isValidForCreate: column.IsValidForCreate,
          isValidForUpdate: column.IsValidForUpdate,
          isCustomAttribute: column.IsCustomAttribute,
          isManaged: column.IsManaged,
          isPrimaryId: column.IsPrimaryId,
          isPrimaryName: column.IsPrimaryName
        };

        // Add targets for Lookup columns - try multiple approaches
        if (column.AttributeType === 'Lookup') {
          // Approach 1: Direct Targets property
          if (column.Targets && Array.isArray(column.Targets)) {
            columnSchema.targets = column.Targets;
            log(`    Found lookup column ${column.LogicalName} with targets: ${column.Targets.join(', ')}`);
          } else {
            // Approach 2: Try to get relationship information
            try {
              // Look for relationships where this column is the referencing attribute
              const relationshipsUrl = `EntityDefinitions(LogicalName='${table.LogicalName}')/OneToManyRelationships?$filter=ReferencingAttribute eq '${column.LogicalName}'`;
              const relationshipsResponse = await client.getMetadata(relationshipsUrl);
              
              if (relationshipsResponse.value && relationshipsResponse.value.length > 0) {
                const targets = relationshipsResponse.value.map((rel: any) => rel.ReferencedEntity);
                if (targets.length > 0) {
                  columnSchema.targets = targets;
                  log(`    Found lookup column ${column.LogicalName} with targets from relationships: ${targets.join(', ')}`);
                }
              } else {
                log(`    Lookup column ${column.LogicalName} has no relationship information`);
              }
            } catch (relationshipError) {
              log(`    Could not get relationship info for ${column.LogicalName}: ${relationshipError instanceof Error ? relationshipError.message : 'Unknown error'}`);
            }
          }
        }

        // Add other type-specific properties that are now available
        if (column.MaxLength !== undefined) {
          columnSchema.maxLength = column.MaxLength;
        }
        if (column.Format !== undefined) {
          columnSchema.format = column.Format;
        }
        if (column.MinValue !== undefined) {
          columnSchema.minValue = column.MinValue;
        }
        if (column.MaxValue !== undefined) {
          columnSchema.maxValue = column.MaxValue;
        }
        if (column.Precision !== undefined) {
          columnSchema.precision = column.Precision;
        }
        if (column.DateTimeFormat !== undefined) {
          columnSchema.dateTimeFormat = column.DateTimeFormat;
        }
        if (column.DefaultValue !== undefined) {
          columnSchema.defaultValue = column.DefaultValue;
        }

        tableSchema.columns.push(columnSchema);
      }

      schema.tables.push(tableSchema);
    }

    // Export relationships - only include relationships between exported tables
    log('Exporting relationships...');
    try {
      const exportedTableNames = schema.tables.map(t => t.logicalName);
      const exportedTableSet = new Set(exportedTableNames);
      
      log(`Filtering relationships to only include those between exported tables: ${exportedTableNames.join(', ')}`);
      
      // Use a more efficient approach to avoid 414 URI Too Long errors
      // Fetch relationships with minimal server-side filtering and apply comprehensive client-side filtering
      
      // Export OneToMany relationships using cast syntax
      log('Exporting OneToMany relationships...');
      const oneToManyFilters = [];
      
      // Only apply system/custom filtering on server side to avoid URI length issues
      if (!includeSystemRelationships) {
        oneToManyFilters.push("IsCustomRelationship eq true");
      }
      
      const oneToManyParams: Record<string, any> = {
        $select: "SchemaName,RelationshipType,IsCustomRelationship,IsManaged,IsValidForAdvancedFind,ReferencedEntity,ReferencingEntity,ReferencingAttribute,IsHierarchical,CascadeConfiguration"
      };
      
      if (oneToManyFilters.length > 0) {
        oneToManyParams.$filter = oneToManyFilters.join(" and ");
      }
      
      const oneToManyResult = await client.getMetadata(
        "RelationshipDefinitions/Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata",
        oneToManyParams
      );
      
      log(`Retrieved ${oneToManyResult.value.length} OneToMany relationships from server`);
      
      let oneToManyFiltered = 0;
      for (const relationship of oneToManyResult.value) {
        // CRITICAL: Only include relationships where BOTH entities are in the exported tables
        if (!exportedTableSet.has(relationship.ReferencedEntity) ||
            !exportedTableSet.has(relationship.ReferencingEntity)) {
          continue;
        }
        
        // Apply additional client-side filtering based on parameters
        if (prefixOnly || (customizationPrefixes && customizationPrefixes.length > 0)) {
          // Check if relationship involves tables with the specified prefixes
          const prefixesToCheck = customizationPrefixes || (prefixOnly && solutionContext?.customizationPrefix ? [solutionContext.customizationPrefix] : []);
          if (prefixesToCheck.length > 0) {
            const referencedMatches = prefixesToCheck.some(prefix =>
              relationship.ReferencedEntity.toLowerCase().startsWith(prefix.toLowerCase() + '_')
            );
            const referencingMatches = prefixesToCheck.some(prefix =>
              relationship.ReferencingEntity.toLowerCase().startsWith(prefix.toLowerCase() + '_')
            );
            
            // Include if either entity matches the prefix (relationships can cross prefix boundaries)
            if (!referencedMatches && !referencingMatches) {
              continue;
            }
          }
        }
        
        const relationshipSchema: RelationshipSchema = {
          schemaName: relationship.SchemaName,
          relationshipType: "OneToMany",
          referencedEntity: relationship.ReferencedEntity,
          referencingEntity: relationship.ReferencingEntity,
          referencingAttribute: relationship.ReferencingAttribute,
          cascadeConfiguration: relationship.CascadeConfiguration,
          isCustomRelationship: relationship.IsCustomRelationship,
          isManaged: relationship.IsManaged
        };
        
        schema.relationships.push(relationshipSchema);
        oneToManyFiltered++;
      }
      
      log(`Filtered to ${oneToManyFiltered} OneToMany relationships involving exported tables`);
      
      // Export ManyToMany relationships using cast syntax
      log('Exporting ManyToMany relationships...');
      const manyToManyFilters = [];
      
      // Only apply system/custom filtering on server side to avoid URI length issues
      if (!includeSystemRelationships) {
        manyToManyFilters.push("IsCustomRelationship eq true");
      }
      
      const manyToManyParams: Record<string, any> = {
        $select: "SchemaName,RelationshipType,IsCustomRelationship,IsManaged,IsValidForAdvancedFind,Entity1LogicalName,Entity2LogicalName,IntersectEntityName"
      };
      
      if (manyToManyFilters.length > 0) {
        manyToManyParams.$filter = manyToManyFilters.join(" and ");
      }
      
      const manyToManyResult = await client.getMetadata(
        "RelationshipDefinitions/Microsoft.Dynamics.CRM.ManyToManyRelationshipMetadata",
        manyToManyParams
      );
      
      log(`Retrieved ${manyToManyResult.value.length} ManyToMany relationships from server`);
      
      let manyToManyFiltered = 0;
      for (const relationship of manyToManyResult.value) {
        // CRITICAL: Only include relationships where BOTH entities are in the exported tables
        if (!exportedTableSet.has(relationship.Entity1LogicalName) ||
            !exportedTableSet.has(relationship.Entity2LogicalName)) {
          continue;
        }
        
        // Apply additional client-side filtering based on parameters
        if (prefixOnly || (customizationPrefixes && customizationPrefixes.length > 0)) {
          // Check if relationship involves tables with the specified prefixes
          const prefixesToCheck = customizationPrefixes || (prefixOnly && solutionContext?.customizationPrefix ? [solutionContext.customizationPrefix] : []);
          if (prefixesToCheck.length > 0) {
            const entity1Matches = prefixesToCheck.some(prefix =>
              relationship.Entity1LogicalName.toLowerCase().startsWith(prefix.toLowerCase() + '_')
            );
            const entity2Matches = prefixesToCheck.some(prefix =>
              relationship.Entity2LogicalName.toLowerCase().startsWith(prefix.toLowerCase() + '_')
            );
            
            // Include if either entity matches the prefix (relationships can cross prefix boundaries)
            if (!entity1Matches && !entity2Matches) {
              continue;
            }
          }
        }
        
        const relationshipSchema: RelationshipSchema = {
          schemaName: relationship.SchemaName,
          relationshipType: "ManyToMany",
          entity1LogicalName: relationship.Entity1LogicalName,
          entity2LogicalName: relationship.Entity2LogicalName,
          intersectEntityName: relationship.IntersectEntityName,
          isCustomRelationship: relationship.IsCustomRelationship,
          isManaged: relationship.IsManaged
        };
        
        schema.relationships.push(relationshipSchema);
        manyToManyFiltered++;
      }
      
      log(`Filtered to ${manyToManyFiltered} ManyToMany relationships involving exported tables`);
      log(`Completed relationship export. Total exported: ${schema.relationships.length}`);
    } catch (error) {
      log(`Warning: Could not export relationships: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Full relationship export error:', error);
    }

    // Write the schema to file
    const jsonOutput = prettify ? JSON.stringify(schema, null, 2) : JSON.stringify(schema);
    
    // Ensure the directory exists
    const outputDir = path.dirname(outputPath);
    if (outputDir !== '.' && !fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, jsonOutput, 'utf8');

    const stats = {
      tables: schema.tables.length,
      totalColumns: schema.tables.reduce((sum, table) => sum + table.columns.length, 0),
      globalOptionSets: schema.globalOptionSets.length,
      relationships: schema.relationships.length
    };

    log('Schema export completed successfully!');
    
    return `Schema export completed successfully!

🔍 **Debug Output:**
${debugMessages.map(msg => `  ${msg}`).join('\n')}


📊 **Export Summary:**
- **Tables:** ${stats.tables}
- **Columns:** ${stats.totalColumns}
- **Global Option Sets:** ${stats.globalOptionSets}
- **Relationships:** ${stats.relationships}

📁 **Output:** ${outputPath}
📏 **File Size:** ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB

${solutionContext ? `🔧 **Solution Context:** ${solutionContext.solutionDisplayName} (${solutionContext.solutionUniqueName})` : ''}

The schema has been exported as ${prettify ? 'formatted' : 'minified'} JSON and includes:
- Complete table definitions with all properties
- All columns with type-specific metadata
- Global and local option sets with all options
- One-to-Many and Many-to-Many relationships
- Cascade configurations and relationship metadata

${includeAllSystemTables ? '⚠️ All system tables included' : (systemTablesToInclude.length > 0 ? `⚠️ Selected system tables included: ${systemTablesToInclude.join(', ')}` : '✅ Custom tables only')}
${includeSystemColumns ? '⚠️ System columns included' : '✅ Custom columns only'}
${includeSystemOptionSets ? '⚠️ System option sets included' : '✅ Custom option sets only'}
${includeSystemRelationships ? '⚠️ System relationships included' : '✅ Custom relationships only'}
${prefixOnly && solutionContext?.customizationPrefix ? `🎯 Filtered to ${solutionContext.customizationPrefix}_ prefix only` : ''}`;

  } catch (error: any) {
    console.error('Schema export failed:', error);
    throw new Error(`Failed to export solution schema: ${error.message}`);
  }
}

export async function generateMermaidDiagram(
  client: DataverseClient,
  args: z.infer<typeof generateMermaidDiagramSchema>
): Promise<string> {
  try {
    const { schemaPath, outputPath = 'schema-diagram.mmd', includeColumns, includeRelationships, tableNameFilter } = args;
    
    // Read and parse the schema JSON file
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }
    
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    let schema: SolutionSchema;
    
    try {
      schema = JSON.parse(schemaContent);
    } catch (parseError) {
      throw new Error(`Invalid JSON in schema file: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }
    
    // Validate schema structure
    if (!schema.tables || !Array.isArray(schema.tables)) {
      throw new Error('Invalid schema format: missing or invalid tables array');
    }
    
    const debugMessages: string[] = [];
    const log = (message: string) => {
      console.log(message);
      debugMessages.push(message);
    };
    
    log(`Generating Mermaid diagram from schema with ${schema.tables.length} tables`);
    
    // Filter tables based on tableNameFilter if provided
    let filteredTables = schema.tables;
    if (tableNameFilter && tableNameFilter.length > 0) {
      const filterSet = new Set(tableNameFilter.map(name => name.toLowerCase()));
      filteredTables = schema.tables.filter(table =>
        filterSet.has(table.logicalName.toLowerCase())
      );
      log(`Filtered to ${filteredTables.length} tables based on name filter: ${tableNameFilter.join(', ')}`);
      
      // Log which tables were found and which were not found
      const foundTables = filteredTables.map(t => t.logicalName);
      const notFoundTables = tableNameFilter.filter(name =>
        !foundTables.some(found => found.toLowerCase() === name.toLowerCase())
      );
      
      if (foundTables.length > 0) {
        log(`Found tables: ${foundTables.join(', ')}`);
      }
      if (notFoundTables.length > 0) {
        log(`Tables not found in schema: ${notFoundTables.join(', ')}`);
      }
    } else {
      log('No table name filter specified, including all tables');
    }
    
    const outputFiles: string[] = [];
    const tables = filteredTables;
    
    log(`Generating diagram with ${tables.length} tables`);
    
    // Generate Mermaid ERD syntax with comprehensive header comments
    let mermaidContent = `%% ========================================
%% GENERATED MERMAID DIAGRAM
%% ========================================
%% This file was automatically generated using the Dataverse MCP Server
%% Tool: generate_mermaid_diagram

%% GENERATION PARAMETERS:
%% - schemaPath: ${schemaPath}
%% - outputPath: ${outputPath}
%% - includeColumns: ${includeColumns}
%% - includeRelationships: ${includeRelationships}
%% - tableNameFilter: ${tableNameFilter ? `[${tableNameFilter.join(', ')}]` : 'none (all tables included)'}

%% SCHEMA INFORMATION:
%% - Total tables in schema: ${schema.tables.length}
%% - Tables in this diagram: ${tables.length}
%% - Generated at: ${new Date().toISOString()}
${schema.metadata.solutionUniqueName ? `%% - Solution: ${schema.metadata.solutionDisplayName} (${schema.metadata.solutionUniqueName})\n` : ''}${schema.metadata.publisherPrefix ? `%% - Publisher prefix: ${schema.metadata.publisherPrefix}\n` : ''}
%% USAGE:
%% This diagram can be used with:
%% - Mermaid Live Editor (https://mermaid.live)
%% - VS Code Mermaid Preview extension
%% - GitHub/GitLab (native Mermaid support)
%% - Documentation tools that support Mermaid diagrams

%% To regenerate this diagram, use the Dataverse MCP Server with:
%% generate_mermaid_diagram({
%%   "schemaPath": "${schemaPath}",
%%   "outputPath": "${outputPath}",
%%   "includeColumns": ${includeColumns},
%%   "includeRelationships": ${includeRelationships}${tableNameFilter ? `,\n%%   "tableNameFilter": [${tableNameFilter.map(t => `"${t}"`).join(', ')}]` : ''}
%% })

erDiagram
`;
    
    // Add tables and their columns
    for (const table of tables) {
      const tableName = table.logicalName.replace(/[^a-zA-Z0-9_]/g, '_');
      
      if (includeColumns && table.columns && table.columns.length > 0) {
        mermaidContent += `    ${tableName} {\n`;
        
        // Add columns
        for (const column of table.columns) {
          const columnType = mapDataverseTypeToMermaid(column.attributeType);
          const isPrimaryKey = column.isPrimaryId;
          const isPrimaryName = column.isPrimaryName;
          const isRequired = column.requiredLevel === 'ApplicationRequired' || column.requiredLevel === 'SystemRequired';
          const isLookup = column.attributeType === 'Lookup';
          const columnName = column.logicalName.replace(/[^a-zA-Z0-9_]/g, '_');
          
          // Build column markers
          const pkFkMarkers = [];
          if (isPrimaryKey) {
            pkFkMarkers.push('PK');
          } else if (isLookup) {
            pkFkMarkers.push('FK');
          }

          const otherMarkers = [];
          if (isPrimaryName) {
            otherMarkers.push('Primary Name');
          }
          if (isLookup) {
            // Include target table names in the lookup marker
            if (column.targets && column.targets.length > 0) {
              const targetNames = column.targets.join(', ');
              otherMarkers.push(`Lookup (${targetNames})`);
            } else {
              otherMarkers.push('Lookup');
            }
          }
          if (isRequired) {
            otherMarkers.push('NOT NULL');
          }
          
          const pkFkMarkersStr = pkFkMarkers.length > 0 ? ` ${pkFkMarkers.join(' ')}` : '';
          const otherMarkersStr = otherMarkers.length > 0 ? ` "${otherMarkers.join(' ')}"` : '';
          mermaidContent += `        ${columnType} ${columnName}${pkFkMarkersStr}${otherMarkersStr}\n`;
        }
        
        mermaidContent += '    }\n\n';
      } else {
        // Just add table name without columns
        mermaidContent += `    ${tableName} {\n`;
        mermaidContent += `        string id PK\n`;
        mermaidContent += '    }\n\n';
      }
    }
    
    // Add relationships if requested
    if (includeRelationships) {
      const tableNames = tables.map(t => t.logicalName);
      const relationships: Array<{from: string, to: string, label: string}> = [];
      
      // First, add explicit relationships from schema if available
      if (schema.relationships && schema.relationships.length > 0) {
        log(`Adding ${schema.relationships.length} explicit relationships to diagram`);
        
        for (const relationship of schema.relationships) {
          // Only include relationships where both entities are in filtered tables
          if (relationship.relationshipType === 'OneToMany' &&
              relationship.referencedEntity && relationship.referencingEntity) {
            
            if (tableNames.includes(relationship.referencedEntity) &&
                tableNames.includes(relationship.referencingEntity)) {
              
              const referencedTable = relationship.referencedEntity.replace(/[^a-zA-Z0-9_]/g, '_');
              const referencingTable = relationship.referencingEntity.replace(/[^a-zA-Z0-9_]/g, '_');
              
              relationships.push({
                from: referencedTable,
                to: referencingTable,
                label: relationship.schemaName
              });
            }
          } else if (relationship.relationshipType === 'ManyToMany' &&
                     relationship.entity1LogicalName && relationship.entity2LogicalName) {
            
            if (tableNames.includes(relationship.entity1LogicalName) &&
                tableNames.includes(relationship.entity2LogicalName)) {
              
              const entity1 = relationship.entity1LogicalName.replace(/[^a-zA-Z0-9_]/g, '_');
              const entity2 = relationship.entity2LogicalName.replace(/[^a-zA-Z0-9_]/g, '_');
              
              // For many-to-many, we'll use a different syntax
              mermaidContent += `    ${entity1} }o--o{ ${entity2} : "${relationship.schemaName}"\n`;
            }
          }
        }
      }
      
      // Note: We now rely on exported relationships from the schema instead of extracting from lookup columns
      // This provides more accurate relationship information including proper cascade configurations
      
      // Add all relationships to the diagram
      for (const rel of relationships) {
        mermaidContent += `    ${rel.from} ||--o{ ${rel.to} : "${rel.label}"\n`;
      }
      
      if (relationships.length > 0) {
        log(`Added ${relationships.length} total relationships to diagram`);
      }
    }
    
    // Add end-of-diagram metadata comment
    mermaidContent += `\n%% End of diagram - ${tables.length} tables processed\n`;
    
    // Write the Mermaid file
    const outputDir = path.dirname(outputPath);
    if (outputDir !== '.' && !fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, mermaidContent, 'utf8');
    outputFiles.push(outputPath);
    
    log(`Generated Mermaid diagram: ${outputPath}`);
    
    const totalTables = schema.tables.length;
    const totalColumns = schema.tables.reduce((sum, table) => sum + (table.columns?.length || 0), 0);
    const totalRelationships = schema.relationships?.length || 0;
    
    return `Mermaid diagram generation completed successfully!

🔍 **Debug Output:**
${debugMessages.map(msg => `  ${msg}`).join('\n')}

📊 **Diagram Summary:**
- **Source Schema:** ${schemaPath}
- **Total Tables in Schema:** ${totalTables}
- **Tables in Diagram:** ${tables.length}
- **Columns Processed:** ${totalColumns}
- **Relationships:** ${totalRelationships}
- **Diagram Files:** ${outputFiles.length}

📁 **Output Files:**
${outputFiles.map(file => `- ${file} (${(fs.statSync(file).size / 1024).toFixed(2)} KB)`).join('\n')}

🎨 **Diagram Features:**
${includeColumns ? '✅ Column details included' : '❌ Column details excluded'}
${includeRelationships ? '✅ Relationships included' : '❌ Relationships excluded'}
${tableNameFilter && tableNameFilter.length > 0 ? `🎯 Table filter applied: ${tableNameFilter.join(', ')}` : '📄 All tables included'}

💡 **Usage:**
You can now use these .mmd files with:
- Mermaid Live Editor (https://mermaid.live)
- VS Code Mermaid Preview extension
- GitHub/GitLab (native Mermaid support)
- Documentation tools that support Mermaid diagrams`;

  } catch (error: any) {
    console.error('Mermaid diagram generation failed:', error);
    throw new Error(`Failed to generate Mermaid diagram: ${error.message}`);
  }
}

function mapDataverseTypeToMermaid(attributeType: string): string {
  switch (attributeType?.toLowerCase()) {
    case 'string':
    case 'memo':
      return 'string';
    case 'integer':
    case 'bigint':
      return 'int';
    case 'decimal':
    case 'double':
    case 'money':
      return 'decimal';
    case 'boolean':
      return 'boolean';
    case 'datetime':
      return 'datetime';
    case 'uniqueidentifier':
      return 'uuid';
    case 'lookup':
    case 'customer':
    case 'owner':
      return 'uuid';
    case 'picklist':
    case 'state':
    case 'status':
      return 'int';
    default:
      return 'string';
  }
}

// Note: inferTargetTableFromLookupColumn function removed as we now use exported relationships from schema

// Tool registration functions
export function exportSolutionSchemaTool(server: McpServer, client: DataverseClient): void {
  server.tool(
    'export_solution_schema',
    {
      outputPath: z.string().optional().describe('Path where to save the schema JSON file (default: schema-export.json)'),
      includeAllSystemTables: z.boolean().optional().default(false).describe('Whether to include all system tables in the export'),
      includeSystemColumns: z.boolean().optional().default(false).describe('Whether to include system columns in the export'),
      includeSystemOptionSets: z.boolean().optional().default(false).describe('Whether to include system option sets in the export'),
      includeSystemRelationships: z.boolean().optional().default(false).describe('Whether to include system (non-custom) relationships in the export'),
      prefixOnly: z.boolean().optional().default(false).describe('Whether to export only tables that match the solution customization prefix (deprecated - use customizationPrefixes instead)'),
      customizationPrefixes: z.array(z.string()).optional().describe('List of customization prefixes to include (e.g., ["new", "xyz", "its"]). If not provided and prefixOnly is true, uses solution context prefix'),
      systemTablesToInclude: z.array(z.string()).optional().default(['contact', 'account']).describe('List of system tables to include when includeAllSystemTables is false (default: contact, account)'),
      excludeColumnPrefixes: z.array(z.string()).optional().default(['adx_', 'msa_', 'msdyn_', 'mspp_']).describe('List of column prefixes to exclude from export (default: ["adx_", "msa_", "msdyn_", "mspp_"])'),
      prettify: z.boolean().optional().default(true).describe('Whether to format the JSON output for readability')
    },
    async (args) => {
      try {
        const result = await exportSolutionSchema(client, args);
        return {
          content: [
            {
              type: "text",
              text: result
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error exporting schema: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function generateMermaidDiagramTool(server: McpServer, client: DataverseClient): void {
  server.tool(
    'generate_mermaid_diagram',
    {
      schemaPath: z.string().describe('Path to the exported JSON schema file'),
      outputPath: z.string().optional().describe('Path where to save the Mermaid diagram file (default: schema-diagram.mmd)'),
      includeColumns: z.boolean().optional().default(true).describe('Whether to include column details in the diagram'),
      includeRelationships: z.boolean().optional().default(true).describe('Whether to include relationships in the diagram'),
      tableNameFilter: z.array(z.string()).optional().describe('List of table logical names to include in the diagram. If not specified, all tables will be included.')
    },
    async (args) => {
      try {
        const result = await generateMermaidDiagram(client, args);
        return {
          content: [
            {
              type: "text",
              text: result
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error generating Mermaid diagram: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}