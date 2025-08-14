import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from 'zod';
import { DataverseClient } from '../dataverse-client.js';

// Helper function to create localized labels
function createLocalizedLabel(text: string, languageCode: number = 1033) {
  return {
    LocalizedLabels: [
      {
        Label: text,
        LanguageCode: languageCode,
        IsManaged: false,
        MetadataId: "00000000-0000-0000-0000-000000000000"
      }
    ],
    UserLocalizedLabel: {
      Label: text,
      LanguageCode: languageCode,
      IsManaged: false,
      MetadataId: "00000000-0000-0000-0000-000000000000"
    }
  };
}

// AutoNumber format validation schema
const autoNumberFormatSchema = z.string().refine((format) => {
  // Validate AutoNumber format placeholders
  const validPlaceholders = /^[^{}]*(\{(SEQNUM|RANDSTRING|DATETIMEUTC):[0-9]+\}[^{}]*)*$/;
  const hasValidPlaceholders = validPlaceholders.test(format);
  
  // Check RANDSTRING length constraints (1-6)
  const randStringMatches = format.match(/\{RANDSTRING:(\d+)\}/g);
  if (randStringMatches) {
    for (const match of randStringMatches) {
      const length = parseInt(match.match(/\{RANDSTRING:(\d+)\}/)![1]);
      if (length < 1 || length > 6) {
        return false;
      }
    }
  }
  
  // Check SEQNUM length constraints (minimum 1)
  const seqNumMatches = format.match(/\{SEQNUM:(\d+)\}/g);
  if (seqNumMatches) {
    for (const match of seqNumMatches) {
      const length = parseInt(match.match(/\{SEQNUM:(\d+)\}/)![1]);
      if (length < 1) {
        return false;
      }
    }
  }
  
  return hasValidPlaceholders;
}, {
  message: "Invalid AutoNumber format. Use placeholders like {SEQNUM:4}, {RANDSTRING:3} (1-6), {DATETIMEUTC:yyyyMMdd}"
});

// Helper function to generate schema name from display name and prefix
function generateColumnSchemaName(displayName: string, prefix: string): string {
  // Remove whitespaces and special characters, but preserve original case
  const cleanName = displayName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
  return `${prefix}_${cleanName}`;
}

// Create AutoNumber column tool
export function createAutoNumberColumnTool(server: McpServer, client: DataverseClient) {
  server.registerTool(
    'create_autonumber_column',
    {
      title: 'Create AutoNumber Column',
      description: 'Creates a new AutoNumber column in a Dataverse table with specified format. AutoNumber columns automatically generate alphanumeric strings using sequential numbers, random strings, and datetime placeholders. Requires a solution context to be set first.',
      inputSchema: {
        entityLogicalName: z.string().describe('Logical name of the table to add the AutoNumber column to'),
        displayName: z.string().describe('Display name for the AutoNumber column (e.g., "Serial Number")'),
        schemaName: z.string().optional().describe('Schema name for the column (auto-generated if not provided)'),
        description: z.string().optional().describe('Description of the AutoNumber column'),
        autoNumberFormat: autoNumberFormatSchema.describe('AutoNumber format using placeholders like "PREFIX-{SEQNUM:4}-{RANDSTRING:3}-{DATETIMEUTC:yyyyMMdd}"'),
        requiredLevel: z.enum(['None', 'SystemRequired', 'ApplicationRequired', 'Recommended']).default('None').describe('Required level of the column'),
        maxLength: z.number().min(1).max(4000).default(100).describe('Maximum length for the column (default: 100, ensure enough room for format expansion)'),
        isAuditEnabled: z.boolean().optional().describe('Whether auditing is enabled for this column'),
        isValidForAdvancedFind: z.boolean().optional().describe('Whether the column appears in Advanced Find'),
        isValidForCreate: z.boolean().optional().describe('Whether the column can be set during create'),
        isValidForUpdate: z.boolean().optional().describe('Whether the column can be updated')
      }
    },
    async (params) => {
    
      try {
        // Get the customization prefix from the solution context
        const prefix = client.getCustomizationPrefix();
        if (!prefix) {
          throw new Error('No customization prefix available. Please set a solution context using set_solution_context tool first.');
        }

        // Generate schema name if not provided
        const schemaName = params.schemaName || generateColumnSchemaName(params.displayName, prefix);

        // Prepare the column metadata
        const columnMetadata = {
          "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
          "AttributeType": "String",
          "SchemaName": schemaName,
          "DisplayName": createLocalizedLabel(params.displayName),
          "Format": "Text", // Required for AutoNumber columns
          "AutoNumberFormat": params.autoNumberFormat,
          "RequiredLevel": {
            "Value": params.requiredLevel,
            "CanBeChanged": true,
            "ManagedPropertyLogicalName": "canmodifyrequirementlevelsettings"
          },
          "MaxLength": params.maxLength,
          "IsCustomAttribute": true,
          ...(params.description && {
            "Description": createLocalizedLabel(params.description)
          }),
          ...(params.isAuditEnabled !== undefined && {
            "IsAuditEnabled": {
              "Value": params.isAuditEnabled,
              "CanBeChanged": true,
              "ManagedPropertyLogicalName": "canmodifyauditsettings"
            }
          }),
          ...(params.isValidForAdvancedFind !== undefined && { "IsValidForAdvancedFind": params.isValidForAdvancedFind }),
          ...(params.isValidForCreate !== undefined && { "IsValidForCreate": params.isValidForCreate }),
          ...(params.isValidForUpdate !== undefined && { "IsValidForUpdate": params.isValidForUpdate })
        };

        const result = await client.postMetadata(
          `EntityDefinitions(LogicalName='${params.entityLogicalName}')/Attributes`,
          columnMetadata
        );

        return {
          content: [
            {
              type: "text",
              text: `Successfully created AutoNumber column '${schemaName}' with display name '${params.displayName}' in table '${params.entityLogicalName}'.\n\nAutoNumber Format: ${params.autoNumberFormat}\nMax Length: ${params.maxLength}\nRequired Level: ${params.requiredLevel}\n\nResponse: ${JSON.stringify(result, null, 2)}`
            }
          ]
        };

      } catch (error: any) {
        // Provide specific error messages for common issues
        let errorMessage = `Error creating AutoNumber column: ${error instanceof Error ? error.message : 'Unknown error'}`;
        
        if (error.message?.includes('Invalid Argument')) {
          errorMessage += '\n\nTip: Check AutoNumber format syntax. Use {SEQNUM:length}, {RANDSTRING:1-6}, {DATETIMEUTC:format}';
        }
        
        return {
          content: [
            {
              type: "text",
              text: errorMessage
            }
          ],
          isError: true
        };
      }
    }
  );
}

// Update AutoNumber column format tool
export function updateAutoNumberFormatTool(server: McpServer, client: DataverseClient) {
  server.registerTool(
    'update_autonumber_format',
    {
      title: 'Update AutoNumber Format',
      description: 'Updates the AutoNumberFormat of an existing AutoNumber column. This changes how future values will be generated but does not affect existing records.',
      inputSchema: {
        entityLogicalName: z.string().describe('Logical name of the table containing the AutoNumber column'),
        columnLogicalName: z.string().describe('Logical name of the AutoNumber column to update'),
        autoNumberFormat: autoNumberFormatSchema.describe('New AutoNumber format using placeholders like "PREFIX-{SEQNUM:4}-{RANDSTRING:3}-{DATETIMEUTC:yyyyMMdd}"'),
        displayName: z.string().optional().describe('New display name for the column'),
        description: z.string().optional().describe('New description for the column'),
        maxLength: z.number().min(1).max(4000).optional().describe('New maximum length (ensure enough room for format expansion)')
      }
    },
    async (params) => {
      try {
        // First, retrieve the current attribute definition
        const currentAttribute = await client.getMetadata(
          `EntityDefinitions(LogicalName='${params.entityLogicalName}')/Attributes(LogicalName='${params.columnLogicalName}')`
        );

        // Create the updated attribute definition
        const updatedAttribute: any = {
          ...currentAttribute,
          "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
          "AutoNumberFormat": params.autoNumberFormat
        };

        // Add optional fields if provided
        if (params.displayName) {
          updatedAttribute.DisplayName = createLocalizedLabel(params.displayName);
        }

        if (params.description) {
          updatedAttribute.Description = createLocalizedLabel(params.description);
        }

        if (params.maxLength) {
          updatedAttribute.MaxLength = params.maxLength;
        }

        // Use PUT method with MSCRM.MergeLabels header
        await client.putMetadata(
          `EntityDefinitions(LogicalName='${params.entityLogicalName}')/Attributes(LogicalName='${params.columnLogicalName}')`,
          updatedAttribute,
          {
            'MSCRM.MergeLabels': 'true'
          }
        );

        return {
          content: [
            {
              type: "text",
              text: `Successfully updated AutoNumber format for column '${params.columnLogicalName}' in table '${params.entityLogicalName}'.\n\nNew AutoNumber Format: ${params.autoNumberFormat}${params.displayName ? `\nNew Display Name: ${params.displayName}` : ''}${params.maxLength ? `\nNew Max Length: ${params.maxLength}` : ''}`
            }
          ]
        };

      } catch (error: any) {
        let errorMessage = `Error updating AutoNumber format: ${error instanceof Error ? error.message : 'Unknown error'}`;
        
        if (error.message?.includes('Invalid Argument')) {
          errorMessage += '\n\nTip: Check AutoNumber format syntax. Use {SEQNUM:length}, {RANDSTRING:1-6}, {DATETIMEUTC:format}';
        }
        
        return {
          content: [
            {
              type: "text",
              text: errorMessage
            }
          ],
          isError: true
        };
      }
    }
  );
}

// Set AutoNumber seed tool
export function setAutoNumberSeedTool(server: McpServer, client: DataverseClient) {
  server.registerTool(
    'set_autonumber_seed',
    {
      title: 'Set AutoNumber Seed',
      description: 'Sets the seed value for an AutoNumber column\'s sequential segment using the SetAutoNumberSeed action. This controls the starting number for future records. Note: Seed values are environment-specific and not included in solutions.',
      inputSchema: {
        entityLogicalName: z.string().describe('Logical name of the table containing the AutoNumber column'),
        columnLogicalName: z.string().describe('Logical name of the AutoNumber column'),
        seedValue: z.number().int().min(1).describe('Next sequential number to use (e.g., 10000 to start from 10000)')
      }
    },
    async (params) => {
      try {
        // Use the SetAutoNumberSeed action
        const actionData = {
          "EntityLogicalName": params.entityLogicalName,
          "AttributeLogicalName": params.columnLogicalName,
          "Value": params.seedValue
        };

        await client.post('SetAutoNumberSeed', actionData);

        return {
          content: [
            {
              type: "text",
              text: `Successfully set AutoNumber seed for column '${params.columnLogicalName}' in table '${params.entityLogicalName}'.\n\nSeed Value: ${params.seedValue}\n\nNote: Seed value only affects future records and is environment-specific (not included in solutions).`
            }
          ]
        };

      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error setting AutoNumber seed: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

// Get AutoNumber column info tool
export function getAutoNumberColumnTool(server: McpServer, client: DataverseClient) {
  server.registerTool(
    'get_autonumber_column',
    {
      title: 'Get AutoNumber Column',
      description: 'Retrieves detailed information about an AutoNumber column including its current format, properties, and configuration.',
      inputSchema: {
        entityLogicalName: z.string().describe('Logical name of the table'),
        columnLogicalName: z.string().describe('Logical name of the AutoNumber column to retrieve')
      }
    },
    async (params) => {
      try {
        const column = await client.getMetadata(
          `EntityDefinitions(LogicalName='${params.entityLogicalName}')/Attributes(LogicalName='${params.columnLogicalName}')`
        );

        // Check if it's an AutoNumber column
        if (column.AttributeType !== 'String' || !column.AutoNumberFormat) {
          return {
            content: [
              {
                type: "text",
                text: `The specified column '${params.columnLogicalName}' is not an AutoNumber column.\n\nAttribute Type: ${column.AttributeType}\nHas AutoNumber Format: ${!!column.AutoNumberFormat}`
              }
            ],
            isError: true
          };
        }

        const columnInfo = {
          logicalName: column.LogicalName,
          schemaName: column.SchemaName,
          displayName: column.DisplayName?.UserLocalizedLabel?.Label || column.DisplayName?.LocalizedLabels?.[0]?.Label,
          description: column.Description?.UserLocalizedLabel?.Label || column.Description?.LocalizedLabels?.[0]?.Label,
          autoNumberFormat: column.AutoNumberFormat,
          attributeType: column.AttributeType,
          format: column.Format,
          maxLength: column.MaxLength,
          requiredLevel: column.RequiredLevel?.Value,
          isAuditEnabled: column.IsAuditEnabled?.Value,
          isValidForAdvancedFind: column.IsValidForAdvancedFind?.Value,
          isValidForCreate: column.IsValidForCreate?.Value,
          isValidForUpdate: column.IsValidForUpdate?.Value,
          isCustomAttribute: column.IsCustomAttribute?.Value,
          isManaged: column.IsManaged?.Value,
          metadataId: column.MetadataId
        };

        return {
          content: [
            {
              type: "text",
              text: `AutoNumber column information for '${params.columnLogicalName}' in table '${params.entityLogicalName}':\n\n${JSON.stringify(columnInfo, null, 2)}`
            }
          ]
        };

      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error retrieving AutoNumber column: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

// List AutoNumber columns tool
export function listAutoNumberColumnsTool(server: McpServer, client: DataverseClient) {
  server.registerTool(
    'list_autonumber_columns',
    {
      title: 'List AutoNumber Columns',
      description: 'Lists all AutoNumber columns in a specific table or across all tables in the environment. Helps identify existing AutoNumber implementations.',
      inputSchema: {
        entityLogicalName: z.string().optional().describe('Logical name of specific table (if not provided, searches all tables)'),
        customOnly: z.boolean().default(true).describe('Whether to list only custom AutoNumber columns'),
        includeManaged: z.boolean().default(false).describe('Whether to include managed AutoNumber columns')
      }
    },
    async (params) => {
      try {
        let queryParams: Record<string, any> = {
          $select: "LogicalName,SchemaName,DisplayName,AutoNumberFormat,MaxLength,RequiredLevel,IsCustomAttribute,IsManaged,EntityLogicalName"
        };

        let filters: string[] = [
          "AttributeType eq Microsoft.Dynamics.CRM.AttributeTypeCode'String'",
          "AutoNumberFormat ne null"
        ];
        
        if (!params.includeManaged) {
          filters.push("IsManaged eq false");
        }
        
        if (params.customOnly) {
          filters.push("IsCustomAttribute eq true");
        }

        queryParams.$filter = filters.join(" and ");

        let endpoint: string;
        if (params.entityLogicalName) {
          endpoint = `EntityDefinitions(LogicalName='${params.entityLogicalName}')/Attributes`;
        } else {
          endpoint = `AttributeMetadata`;
        }

        const result = await client.getMetadata(endpoint, queryParams);
        const columns = result.value || [];

        const autoNumberColumns = columns.map((column: any) => ({
          entityLogicalName: column.EntityLogicalName,
          logicalName: column.LogicalName,
          schemaName: column.SchemaName,
          displayName: column.DisplayName?.UserLocalizedLabel?.Label || column.DisplayName?.LocalizedLabels?.[0]?.Label,
          autoNumberFormat: column.AutoNumberFormat,
          maxLength: column.MaxLength,
          requiredLevel: column.RequiredLevel?.Value,
          isCustomAttribute: column.IsCustomAttribute?.Value,
          isManaged: column.IsManaged?.Value
        }));

        return {
          content: [
            {
              type: "text",
              text: `Found ${autoNumberColumns.length} AutoNumber column(s)${params.entityLogicalName ? ` in table '${params.entityLogicalName}'` : ''}:\n\n${JSON.stringify(autoNumberColumns, null, 2)}`
            }
          ]
        };

      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error listing AutoNumber columns: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

// Convert existing column to AutoNumber tool
export function convertToAutoNumberTool(server: McpServer, client: DataverseClient) {
  server.registerTool(
    'convert_to_autonumber',
    {
      title: 'Convert to AutoNumber',
      description: 'Converts an existing text column to an AutoNumber column by adding an AutoNumberFormat. The column must be a String type with Text format and should be empty or contain compatible data.',
      inputSchema: {
        entityLogicalName: z.string().describe('Logical name of the table containing the column'),
        columnLogicalName: z.string().describe('Logical name of the existing text column to convert'),
        autoNumberFormat: autoNumberFormatSchema.describe('AutoNumber format to apply using placeholders like "PREFIX-{SEQNUM:4}-{RANDSTRING:3}"'),
        maxLength: z.number().min(1).max(4000).optional().describe('New maximum length if needed (ensure enough room for format expansion)')
      }
    },
    async (params) => {
      try {
        // First, get the current column to validate it can be converted
        const currentColumn = await client.getMetadata(
          `EntityDefinitions(LogicalName='${params.entityLogicalName}')/Attributes(LogicalName='${params.columnLogicalName}')`
        );

        // Validate the column can be converted
        if (currentColumn.AttributeType !== 'String') {
          return {
            content: [
              {
                type: "text",
                text: `Cannot convert column to AutoNumber. Only String type columns can be converted.\n\nCurrent Attribute Type: ${currentColumn.AttributeType}`
              }
            ],
            isError: true
          };
        }

        if (currentColumn.Format !== 'Text') {
          return {
            content: [
              {
                type: "text",
                text: `Cannot convert column to AutoNumber. Only Text format columns can be converted.\n\nCurrent Format: ${currentColumn.Format}`
              }
            ],
            isError: true
          };
        }

        if (currentColumn.AutoNumberFormat) {
          return {
            content: [
              {
                type: "text",
                text: `Column is already an AutoNumber column.\n\nCurrent AutoNumber Format: ${currentColumn.AutoNumberFormat}`
              }
            ],
            isError: true
          };
        }

        // Prepare the update payload
        const updateData: any = {
          ...currentColumn,
          "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
          "AutoNumberFormat": params.autoNumberFormat
        };

        if (params.maxLength) {
          updateData.MaxLength = params.maxLength;
        }

        // Use PUT method with MSCRM.MergeLabels header
        await client.putMetadata(
          `EntityDefinitions(LogicalName='${params.entityLogicalName}')/Attributes(LogicalName='${params.columnLogicalName}')`,
          updateData,
          {
            'MSCRM.MergeLabels': 'true'
          }
        );

        return {
          content: [
            {
              type: "text",
              text: `Successfully converted column '${params.columnLogicalName}' to AutoNumber in table '${params.entityLogicalName}'.\n\nAutoNumber Format: ${params.autoNumberFormat}\nPrevious Format: ${currentColumn.Format}${params.maxLength ? `\nNew Max Length: ${params.maxLength}` : ''}\n\nWarning: Existing data in the column will remain unchanged. New records will use the AutoNumber format.`
            }
          ]
        };

      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error converting column to AutoNumber: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}