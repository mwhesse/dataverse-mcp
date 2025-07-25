import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DataverseClient } from "../dataverse-client.js";
import { OptionSetMetadata, OptionMetadata, ODataResponse, LocalizedLabel } from "../types.js";

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

export function createOptionSetTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "create_dataverse_optionset",
    {
      name: z.string().describe("Name for the option set (e.g., 'new_priority')"),
      displayName: z.string().describe("Display name for the option set"),
      description: z.string().optional().describe("Description of the option set"),
      isGlobal: z.boolean().default(true).describe("Whether this is a global option set"),
      options: z.array(z.object({
        value: z.number().describe("Numeric value for the option"),
        label: z.string().describe("Display label for the option"),
        description: z.string().optional().describe("Description for the option"),
        color: z.string().optional().describe("Color for the option (hex format, e.g., '#FF0000')")
      })).describe("Array of options for the option set")
    },
    async (params) => {
      try {
        if (!params.options || params.options.length === 0) {
          throw new Error("At least one option is required");
        }

        const optionSetDefinition = {
          "@odata.type": "Microsoft.Dynamics.CRM.OptionSetMetadata",
          Name: params.name,
          DisplayName: createLocalizedLabel(params.displayName),
          Description: params.description ? createLocalizedLabel(params.description) : undefined,
          OptionSetType: "Picklist", // Use string instead of numeric
          IsGlobal: params.isGlobal,
          IsCustomOptionSet: true,
          Options: params.options.map(option => ({
            Value: option.value,
            Label: createLocalizedLabel(option.label),
            Description: option.description ? createLocalizedLabel(option.description) : undefined,
            Color: option.color,
            IsManaged: false
          }))
        };

        const result = await client.postMetadata("GlobalOptionSetDefinitions", optionSetDefinition);

        return {
          content: [
            {
              type: "text",
              text: `Successfully created option set '${params.name}' with ${params.options.length} options.\n\nResponse: ${JSON.stringify(result, null, 2)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error creating option set: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function getOptionSetTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "get_dataverse_optionset",
    {
      name: z.string().describe("Name of the option set to retrieve")
    },
    async (params) => {
      try {
        const result = await client.getMetadata<OptionSetMetadata>(
          `GlobalOptionSetDefinitions(Name='${params.name}')`
        );

        return {
          content: [
            {
              type: "text",
              text: `Option set information for '${params.name}':\n\n${JSON.stringify(result, null, 2)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error retrieving option set: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function updateOptionSetTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "update_dataverse_optionset",
    {
      name: z.string().describe("Name of the option set to update"),
      displayName: z.string().optional().describe("New display name for the option set"),
      description: z.string().optional().describe("New description of the option set"),
      addOptions: z.array(z.object({
        value: z.number().describe("Numeric value for the new option"),
        label: z.string().describe("Display label for the new option"),
        description: z.string().optional().describe("Description for the new option"),
        color: z.string().optional().describe("Color for the new option (hex format)")
      })).optional().describe("New options to add to the option set"),
      updateOptions: z.array(z.object({
        value: z.number().describe("Numeric value of the option to update"),
        label: z.string().optional().describe("New display label for the option"),
        description: z.string().optional().describe("New description for the option"),
        color: z.string().optional().describe("New color for the option (hex format)")
      })).optional().describe("Existing options to update"),
      removeOptions: z.array(z.number()).optional().describe("Values of options to remove from the option set")
    },
    async (params) => {
      try {
        const updateData: any = {};

        if (params.displayName) {
          updateData.DisplayName = createLocalizedLabel(params.displayName);
        }
        if (params.description) {
          updateData.Description = createLocalizedLabel(params.description);
        }

        // Update basic properties if provided
        if (Object.keys(updateData).length > 0) {
          await client.patchMetadata(`GlobalOptionSetDefinitions(Name='${params.name}')`, updateData);
        }

        // Add new options using InsertOptionValue action
        if (params.addOptions && params.addOptions.length > 0) {
          for (const option of params.addOptions) {
            const insertOptionData = {
              OptionSetName: params.name,
              Value: option.value,
              Label: createLocalizedLabel(option.label),
              Description: option.description ? createLocalizedLabel(option.description) : undefined,
              Color: option.color
            };

            await client.callAction("InsertOptionValue", insertOptionData);
          }
        }

        // Remove options using DeleteOptionValue action
        if (params.removeOptions && params.removeOptions.length > 0) {
          for (const optionValue of params.removeOptions) {
            const deleteOptionData = {
              OptionSetName: params.name,
              Value: optionValue
            };

            await client.callAction("DeleteOptionValue", deleteOptionData);
          }
        }

        // Note: UpdateOptionValue action doesn't exist in the Web API
        // To update existing options, you need to delete and re-add them
        if (params.updateOptions && params.updateOptions.length > 0) {
          for (const option of params.updateOptions) {
            // First delete the existing option
            const deleteOptionData = {
              OptionSetName: params.name,
              Value: option.value
            };
            await client.callAction("DeleteOptionValue", deleteOptionData);

            // Then add it back with updated values
            const insertOptionData = {
              OptionSetName: params.name,
              Value: option.value,
              Label: option.label ? createLocalizedLabel(option.label) : undefined,
              Description: option.description ? createLocalizedLabel(option.description) : undefined,
              Color: option.color
            };

            await client.callAction("InsertOptionValue", insertOptionData);
          }
        }

        let message = `Successfully updated option set '${params.name}'.`;
        if (params.addOptions?.length) {
          message += ` Added ${params.addOptions.length} options.`;
        }
        if (params.updateOptions?.length) {
          message += ` Updated ${params.updateOptions.length} options.`;
        }
        if (params.removeOptions?.length) {
          message += ` Removed ${params.removeOptions.length} options.`;
        }

        return {
          content: [
            {
              type: "text",
              text: message
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error updating option set: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function deleteOptionSetTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "delete_dataverse_optionset",
    {
      name: z.string().describe("Name of the option set to delete")
    },
    async (params) => {
      try {
        await client.deleteMetadata(`GlobalOptionSetDefinitions(Name='${params.name}')`);

        return {
          content: [
            {
              type: "text",
              text: `Successfully deleted option set '${params.name}'.`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error deleting option set: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function listOptionSetsTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "list_dataverse_optionsets",
    {
      customOnly: z.boolean().default(false).describe("Whether to list only custom option sets"),
      includeManaged: z.boolean().default(false).describe("Whether to include managed option sets"),
      top: z.number().optional().describe("Maximum number of option sets to return (default: 50)"),
      filter: z.string().optional().describe("OData filter expression")
    },
    async (params) => {
      try {
        // Note: $filter is not supported on GlobalOptionSetDefinitions
        let queryParams: Record<string, any> = {
          $select: "Name,DisplayName,Description,IsCustomOptionSet,IsManaged,IsGlobal,OptionSetType"
        };

        // Add top parameter if specified
        if (params.top) {
          queryParams.$top = params.top;
        }

        const result = await client.getMetadata<ODataResponse<OptionSetMetadata>>(
          "GlobalOptionSetDefinitions",
          queryParams
        );

        const optionSetList = result.value.map(optionSet => ({
          name: optionSet.Name,
          displayName: optionSet.DisplayName?.UserLocalizedLabel?.Label || optionSet.Name,
          description: optionSet.Description?.UserLocalizedLabel?.Label || "",
          isCustom: optionSet.IsCustomOptionSet,
          isManaged: optionSet.IsManaged,
          isGlobal: optionSet.IsGlobal,
          optionSetType: optionSet.OptionSetType,
          optionCount: optionSet.Options?.length || 0
        }));

        return {
          content: [
            {
              type: "text",
              text: `Found ${optionSetList.length} option sets:\n\n${JSON.stringify(optionSetList, null, 2)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error listing option sets: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

// Additional tool to get option set options/values
export function getOptionSetOptionsTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "get_dataverse_optionset_options",
    {
      name: z.string().describe("Name of the option set to get options for")
    },
    async (params) => {
      try {
        // Get the option set with its options - this should work as we've seen it does
        const result = await client.getMetadata<OptionSetMetadata>(
          `GlobalOptionSetDefinitions(Name='${params.name}')`
        );

        const options = result.Options?.map(option => ({
          value: option.Value,
          label: option.Label?.UserLocalizedLabel?.Label || "",
          description: option.Description?.UserLocalizedLabel?.Label || "",
          color: option.Color,
          isManaged: option.IsManaged
        })) || [];

        return {
          content: [
            {
              type: "text",
              text: `Options for option set '${params.name}':\n\n${JSON.stringify(options, null, 2)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error retrieving option set options: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}