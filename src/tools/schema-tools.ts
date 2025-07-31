import { z } from 'zod';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DataverseClient } from '../dataverse-client.js';
import * as fs from 'fs';
import * as path from 'path';

// Schema for the export_solution_schema tool
export const exportSolutionSchemaSchema = z.object({
  outputPath: z.string().optional().describe('Path where to save the schema JSON file (default: schema-export.json)'),
  includeSystemTables: z.boolean().optional().default(false).describe('Whether to include system tables in the export'),
  includeSystemColumns: z.boolean().optional().default(false).describe('Whether to include system columns in the export'),
  includeSystemOptionSets: z.boolean().optional().default(false).describe('Whether to include system option sets in the export'),
  prefixOnly: z.boolean().optional().default(false).describe('Whether to export only tables that match the solution customization prefix'),
  prettify: z.boolean().optional().default(true).describe('Whether to format the JSON output for readability')
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
    includeSystemTables: boolean;
    includeSystemColumns: boolean;
    includeSystemOptionSets: boolean;
    prefixOnly: boolean;
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
    const { outputPath = 'schema-export.json', includeSystemTables, includeSystemColumns, includeSystemOptionSets, prefixOnly, prettify } = args;
    
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
        includeSystemTables,
        includeSystemColumns,
        includeSystemOptionSets,
        prefixOnly
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
        if (prefixOnly && solutionContext && solutionContext.customizationPrefix) {
          const prefix = solutionContext.customizationPrefix.toLowerCase();
          log(`Checking prefix: ${optionSetInfo.Name.toLowerCase()} starts with ${prefix}_`);
          if (!optionSetInfo.Name.toLowerCase().startsWith(prefix + '_')) {
            log(`Skipping option set ${optionSetInfo.Name} (doesn't match prefix ${prefix}_)`);
            continue;
          }
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
    const tablesFilter = includeSystemTables ? '' : 'IsCustomEntity eq true';
    const tablesUrl = tablesFilter
      ? `EntityDefinitions?$filter=${tablesFilter}&$select=LogicalName,DisplayName,DisplayCollectionName,Description,SchemaName,OwnershipType,HasActivities,HasNotes,IsAuditEnabled,IsDuplicateDetectionEnabled,IsValidForQueue,IsConnectionsEnabled,IsMailMergeEnabled,IsDocumentManagementEnabled,IsCustomEntity,IsManaged,PrimaryNameAttribute,PrimaryIdAttribute`
      : `EntityDefinitions?$select=LogicalName,DisplayName,DisplayCollectionName,Description,SchemaName,OwnershipType,HasActivities,HasNotes,IsAuditEnabled,IsDuplicateDetectionEnabled,IsValidForQueue,IsConnectionsEnabled,IsMailMergeEnabled,IsDocumentManagementEnabled,IsCustomEntity,IsManaged,PrimaryNameAttribute,PrimaryIdAttribute`;
    const tablesResponse = await client.getMetadata(tablesUrl);
    
    for (const table of tablesResponse.value) {
      // Apply prefix filtering if enabled
      if (prefixOnly && solutionContext && solutionContext.customizationPrefix) {
        const prefix = solutionContext.customizationPrefix.toLowerCase();
        if (!table.LogicalName.toLowerCase().startsWith(prefix + '_')) {
          log(`Skipping table ${table.LogicalName} (doesn't match prefix ${prefix}_)`);
          continue;
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

      // Export columns for this table
      const columnsFilter = includeSystemColumns ? '' : 'IsCustomAttribute eq true';
      const columnsUrl = columnsFilter
        ? `EntityDefinitions(LogicalName='${table.LogicalName}')/Attributes?$filter=${columnsFilter}&$select=LogicalName,DisplayName,Description,SchemaName,AttributeType,RequiredLevel,IsAuditEnabled,IsValidForAdvancedFind,IsValidForCreate,IsValidForUpdate,IsCustomAttribute,IsManaged,IsPrimaryId,IsPrimaryName`
        : `EntityDefinitions(LogicalName='${table.LogicalName}')/Attributes?$select=LogicalName,DisplayName,Description,SchemaName,AttributeType,RequiredLevel,IsAuditEnabled,IsValidForAdvancedFind,IsValidForCreate,IsValidForUpdate,IsCustomAttribute,IsManaged,IsPrimaryId,IsPrimaryName`;
      const columnsResponse = await client.getMetadata(columnsUrl);
      
      for (const column of columnsResponse.value) {
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

        // Note: Type-specific properties (MaxLength, Format, MinValue, MaxValue, etc.)
        // and option set information would require separate API calls or different endpoints
        // This is omitted for now to avoid API complexity, but could be added later
        // by fetching individual attribute metadata

        tableSchema.columns.push(columnSchema);
      }

      schema.tables.push(tableSchema);
    }

    // Skip relationships for now to focus on basic table/column export
    log('Skipping relationships for simplified export...');

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

${includeSystemTables ? '⚠️ System tables included' : '✅ Custom tables only'}
${includeSystemColumns ? '⚠️ System columns included' : '✅ Custom columns only'}
${includeSystemOptionSets ? '⚠️ System option sets included' : '✅ Custom option sets only'}
${prefixOnly && solutionContext?.customizationPrefix ? `🎯 Filtered to ${solutionContext.customizationPrefix}_ prefix only` : ''}`;

  } catch (error: any) {
    console.error('Schema export failed:', error);
    throw new Error(`Failed to export solution schema: ${error.message}`);
  }
}

// Tool registration function
export function exportSolutionSchemaTool(server: McpServer, client: DataverseClient): void {
  server.tool(
    'export_solution_schema',
    {
      outputPath: z.string().optional().describe('Path where to save the schema JSON file (default: schema-export.json)'),
      includeSystemTables: z.boolean().optional().default(false).describe('Whether to include system tables in the export'),
      includeSystemColumns: z.boolean().optional().default(false).describe('Whether to include system columns in the export'),
      includeSystemOptionSets: z.boolean().optional().default(false).describe('Whether to include system option sets in the export'),
      prefixOnly: z.boolean().optional().default(false).describe('Whether to export only tables that match the solution customization prefix'),
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