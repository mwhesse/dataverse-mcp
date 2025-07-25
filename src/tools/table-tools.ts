import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DataverseClient } from "../dataverse-client.js";
import { EntityMetadata, ODataResponse, LocalizedLabel } from "../types.js";

// Helper function to create localized labels
function createLocalizedLabel(text: string, languageCode: number = 1033): LocalizedLabel {
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

export function createTableTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "create_dataverse_table",
    {
      logicalName: z.string().describe("Logical name for the table (e.g., 'new_customtable')"),
      displayName: z.string().describe("Display name for the table"),
      displayCollectionName: z.string().describe("Display collection name for the table"),
      description: z.string().optional().describe("Description of the table"),
      ownershipType: z.enum(["UserOwned", "OrganizationOwned"]).default("UserOwned").describe("Ownership type of the table"),
      hasActivities: z.boolean().default(false).describe("Whether the table can have activities"),
      hasNotes: z.boolean().default(false).describe("Whether the table can have notes"),
      isAuditEnabled: z.boolean().default(false).describe("Whether auditing is enabled"),
      isDuplicateDetectionEnabled: z.boolean().default(false).describe("Whether duplicate detection is enabled"),
      isValidForQueue: z.boolean().default(false).describe("Whether records can be added to queues"),
      isConnectionsEnabled: z.boolean().default(false).describe("Whether connections are enabled"),
      isMailMergeEnabled: z.boolean().default(false).describe("Whether mail merge is enabled"),
      isDocumentManagementEnabled: z.boolean().default(false).describe("Whether document management is enabled"),
      primaryNameAttribute: z.string().optional().describe("Logical name of the primary name attribute")
    },
    async (params) => {
      try {
        const ownershipTypeValue = params.ownershipType === "UserOwned" ? "UserOwned" : "OrganizationOwned";

        const entityDefinition = {
          "@odata.type": "Microsoft.Dynamics.CRM.EntityMetadata",
          LogicalName: params.logicalName,
          SchemaName: params.logicalName.charAt(0).toUpperCase() + params.logicalName.slice(1),
          DisplayName: createLocalizedLabel(params.displayName),
          DisplayCollectionName: createLocalizedLabel(params.displayCollectionName),
          Description: params.description ? createLocalizedLabel(params.description) : undefined,
          OwnershipType: ownershipTypeValue,
          HasActivities: params.hasActivities,
          HasNotes: params.hasNotes,
          IsActivity: false,
          IsCustomEntity: true,
          Attributes: [
            {
              "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
              LogicalName: params.primaryNameAttribute || `${params.logicalName}_name`,
              SchemaName: (params.primaryNameAttribute || `${params.logicalName}_name`).charAt(0).toUpperCase() + (params.primaryNameAttribute || `${params.logicalName}_name`).slice(1),
              DisplayName: createLocalizedLabel("Name"),
              Description: createLocalizedLabel("Primary name attribute"),
              RequiredLevel: {
                Value: "ApplicationRequired",
                CanBeChanged: false,
                ManagedPropertyLogicalName: "canmodifyrequirementlevelsettings"
              },
              MaxLength: 100,
              Format: "Text",
              IsPrimaryName: true,
              IsCustomAttribute: true
            }
          ]
        };

        const result = await client.postMetadata("EntityDefinitions", entityDefinition);

        return {
          content: [
            {
              type: "text",
              text: `Successfully created table '${params.logicalName}' with display name '${params.displayName}'.\n\nResponse: ${JSON.stringify(result, null, 2)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error creating table: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function getTableTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "get_dataverse_table",
    {
      logicalName: z.string().describe("Logical name of the table to retrieve")
    },
    async (params) => {
      try {
        const result = await client.getMetadata<EntityMetadata>(
          `EntityDefinitions(LogicalName='${params.logicalName}')`
        );

        return {
          content: [
            {
              type: "text",
              text: `Table information for '${params.logicalName}':\n\n${JSON.stringify(result, null, 2)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error retrieving table: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function updateTableTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "update_dataverse_table",
    {
      logicalName: z.string().describe("Logical name of the table to update"),
      displayName: z.string().optional().describe("New display name for the table"),
      displayCollectionName: z.string().optional().describe("New display collection name for the table"),
      description: z.string().optional().describe("New description of the table"),
      hasActivities: z.boolean().optional().describe("Whether the table can have activities"),
      hasNotes: z.boolean().optional().describe("Whether the table can have notes"),
      isAuditEnabled: z.boolean().optional().describe("Whether auditing is enabled"),
      isDuplicateDetectionEnabled: z.boolean().optional().describe("Whether duplicate detection is enabled"),
      isValidForQueue: z.boolean().optional().describe("Whether records can be added to queues"),
      isConnectionsEnabled: z.boolean().optional().describe("Whether connections are enabled"),
      isMailMergeEnabled: z.boolean().optional().describe("Whether mail merge is enabled"),
      isDocumentManagementEnabled: z.boolean().optional().describe("Whether document management is enabled")
    },
    async (params) => {
      try {
        const updateData: any = {};

        if (params.displayName) {
          updateData.DisplayName = createLocalizedLabel(params.displayName);
        }
        if (params.displayCollectionName) {
          updateData.DisplayCollectionName = createLocalizedLabel(params.displayCollectionName);
        }
        if (params.description) {
          updateData.Description = createLocalizedLabel(params.description);
        }
        if (params.hasActivities !== undefined) {
          updateData.HasActivities = params.hasActivities;
        }
        if (params.hasNotes !== undefined) {
          updateData.HasNotes = params.hasNotes;
        }
        if (params.isAuditEnabled !== undefined) {
          updateData.IsAuditEnabled = params.isAuditEnabled;
        }
        if (params.isDuplicateDetectionEnabled !== undefined) {
          updateData.IsDuplicateDetectionEnabled = params.isDuplicateDetectionEnabled;
        }
        if (params.isValidForQueue !== undefined) {
          updateData.IsValidForQueue = params.isValidForQueue;
        }
        if (params.isConnectionsEnabled !== undefined) {
          updateData.IsConnectionsEnabled = params.isConnectionsEnabled;
        }
        if (params.isMailMergeEnabled !== undefined) {
          updateData.IsMailMergeEnabled = params.isMailMergeEnabled;
        }
        if (params.isDocumentManagementEnabled !== undefined) {
          updateData.IsDocumentManagementEnabled = params.isDocumentManagementEnabled;
        }

        await client.patchMetadata(`EntityDefinitions(LogicalName='${params.logicalName}')`, updateData);

        return {
          content: [
            {
              type: "text",
              text: `Successfully updated table '${params.logicalName}'.`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error updating table: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function deleteTableTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "delete_dataverse_table",
    {
      logicalName: z.string().describe("Logical name of the table to delete")
    },
    async (params) => {
      try {
        await client.deleteMetadata(`EntityDefinitions(LogicalName='${params.logicalName}')`);

        return {
          content: [
            {
              type: "text",
              text: `Successfully deleted table '${params.logicalName}'.`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error deleting table: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function listTablesTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "list_dataverse_tables",
    {
      customOnly: z.boolean().default(false).describe("Whether to list only custom tables"),
      includeManaged: z.boolean().default(false).describe("Whether to include managed tables"),
      top: z.number().optional().describe("Maximum number of tables to return (default: 50)"),
      filter: z.string().optional().describe("OData filter expression")
    },
    async (params) => {
      try {
        let queryParams: Record<string, any> = {
          $select: "LogicalName,DisplayName,DisplayCollectionName,IsCustomEntity,IsManaged,OwnershipType,HasActivities,HasNotes"
        };

        let filters: string[] = [];
        
        if (params.customOnly) {
          filters.push("IsCustomEntity eq true");
        }
        
        if (!params.includeManaged) {
          filters.push("IsManaged eq false");
        }

        if (params.filter) {
          filters.push(params.filter);
        }

        if (filters.length > 0) {
          queryParams.$filter = filters.join(" and ");
        }

        const result = await client.getMetadata<ODataResponse<EntityMetadata>>("EntityDefinitions", queryParams);

        const tableList = result.value.map(entity => ({
          logicalName: entity.LogicalName,
          displayName: entity.DisplayName?.UserLocalizedLabel?.Label || entity.LogicalName,
          displayCollectionName: entity.DisplayCollectionName?.UserLocalizedLabel?.Label || "",
          isCustom: entity.IsCustomEntity,
          isManaged: entity.IsManaged,
          ownershipType: entity.OwnershipType,
          hasActivities: entity.HasActivities,
          hasNotes: entity.HasNotes
        }));

        return {
          content: [
            {
              type: "text",
              text: `Found ${tableList.length} tables:\n\n${JSON.stringify(tableList, null, 2)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error listing tables: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}