import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DataverseClient } from "../dataverse-client.js";
import { LocalizedLabel } from "../types.js";

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

export function createPublisherTool(server: McpServer, client: DataverseClient) {
  server.registerTool(
    "create_dataverse_publisher",
    {
      title: "Create Dataverse Publisher",
      description: "Creates a new publisher in Dataverse. Publishers are required for creating solutions and provide customization prefixes for schema names. Use this to establish a publisher identity before creating solutions and custom components.",
      inputSchema: {
        friendlyName: z.string().describe("Friendly name for the publisher"),
        uniqueName: z.string().describe("Unique name for the publisher (e.g., 'examplepublisher')"),
        description: z.string().optional().describe("Description of the publisher"),
        customizationPrefix: z.string().describe("Customization prefix for schema names (e.g., 'sample')"),
        customizationOptionValuePrefix: z.number().describe("Option value prefix (e.g., 72700)")
      }
    },
    async (params) => {
      try {
        const publisherDefinition = {
          friendlyname: params.friendlyName,
          uniquename: params.uniqueName,
          description: params.description || `Publisher for ${params.friendlyName}`,
          customizationprefix: params.customizationPrefix,
          customizationoptionvalueprefix: params.customizationOptionValuePrefix
        };

        const result = await client.post('publishers', publisherDefinition);

        return {
          content: [
            {
              type: "text",
              text: `Successfully created publisher '${params.friendlyName}' with prefix '${params.customizationPrefix}'.\n\nResponse: ${JSON.stringify(result, null, 2)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error creating publisher: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function createSolutionTool(server: McpServer, client: DataverseClient) {
  server.registerTool(
    "create_dataverse_solution",
    {
      title: "Create Dataverse Solution",
      description: "Creates a new unmanaged solution in Dataverse. Solutions are containers for customizations and allow you to package, deploy, and manage custom components. Use this to create a solution before adding tables, columns, and other customizations.",
      inputSchema: {
        friendlyName: z.string().describe("Friendly name for the solution"),
        uniqueName: z.string().describe("Unique name for the solution (e.g., 'examplesolution')"),
        description: z.string().optional().describe("Description of the solution"),
        version: z.string().default("1.0.0.0").describe("Version of the solution"),
        publisherUniqueName: z.string().describe("Unique name of the publisher to associate with this solution")
      }
    },
    async (params) => {
      try {
        // First, get the publisher to get its ID
        const publisherResponse = await client.get(`publishers?$filter=uniquename eq '${params.publisherUniqueName}'&$select=publisherid`);
        
        if (!publisherResponse.value || publisherResponse.value.length === 0) {
          throw new Error(`Publisher with unique name '${params.publisherUniqueName}' not found`);
        }

        const publisherId = publisherResponse.value[0].publisherid;

        const solutionDefinition = {
          friendlyname: params.friendlyName,
          uniquename: params.uniqueName,
          description: params.description || `Solution for ${params.friendlyName}`,
          version: params.version,
          "publisherid@odata.bind": `/publishers(${publisherId})`
        };

        const result = await client.post('solutions', solutionDefinition);

        return {
          content: [
            {
              type: "text",
              text: `Successfully created solution '${params.friendlyName}' (${params.uniqueName}) linked to publisher '${params.publisherUniqueName}'.\n\nResponse: ${JSON.stringify(result, null, 2)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error creating solution: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function getSolutionTool(server: McpServer, client: DataverseClient) {
  server.registerTool(
    "get_dataverse_solution",
    {
      title: "Get Dataverse Solution",
      description: "Retrieves detailed information about a specific solution including its metadata, version, publisher details, and configuration. Use this to inspect solution properties and understand solution structure.",
      inputSchema: {
        uniqueName: z.string().describe("Unique name of the solution to retrieve")
      }
    },
    async (params) => {
      try {
        const result = await client.get(
          `solutions?$filter=uniquename eq '${params.uniqueName}'&$expand=publisherid($select=friendlyname,uniquename,customizationprefix,customizationoptionvalueprefix)`
        );

        if (!result.value || result.value.length === 0) {
          throw new Error(`Solution with unique name '${params.uniqueName}' not found`);
        }

        return {
          content: [
            {
              type: "text",
              text: `Solution information for '${params.uniqueName}':\n\n${JSON.stringify(result.value[0], null, 2)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error retrieving solution: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function getPublisherTool(server: McpServer, client: DataverseClient) {
  server.registerTool(
    "get_dataverse_publisher",
    {
      title: "Get Dataverse Publisher",
      description: "Retrieves detailed information about a specific publisher including its customization prefix, option value prefix, and configuration. Use this to inspect publisher properties and understand customization settings.",
      inputSchema: {
        uniqueName: z.string().describe("Unique name of the publisher to retrieve")
      }
    },
    async (params) => {
      try {
        const result = await client.get(
          `publishers?$filter=uniquename eq '${params.uniqueName}'`
        );

        if (!result.value || result.value.length === 0) {
          throw new Error(`Publisher with unique name '${params.uniqueName}' not found`);
        }

        return {
          content: [
            {
              type: "text",
              text: `Publisher information for '${params.uniqueName}':\n\n${JSON.stringify(result.value[0], null, 2)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error retrieving publisher: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function listSolutionsTool(server: McpServer, client: DataverseClient) {
  server.registerTool(
    "list_dataverse_solutions",
    {
      title: "List Dataverse Solutions",
      description: "Retrieves a list of solutions in the Dataverse environment with filtering options. Use this to discover available solutions, find unmanaged solutions for customization, or get an overview of solution packages. Includes publisher information for each solution.",
      inputSchema: {
        includeManaged: z.boolean().default(false).describe("Whether to include managed solutions"),
        top: z.number().optional().describe("Maximum number of solutions to return")
      }
    },
    async (params) => {
      try {
        let queryParams: Record<string, any> = {
          $select: "friendlyname,uniquename,version,description,ismanaged",
          $expand: "publisherid($select=friendlyname,uniquename,customizationprefix)"
        };

        let filters: string[] = [];
        
        if (!params.includeManaged) {
          filters.push("ismanaged eq false");
        }

        if (filters.length > 0) {
          queryParams.$filter = filters.join(" and ");
        }

        if (params.top) {
          queryParams.$top = params.top;
        }

        const result = await client.get('solutions', queryParams);

        const solutionList = result.value.map((solution: any) => ({
          friendlyName: solution.friendlyname,
          uniqueName: solution.uniquename,
          version: solution.version,
          description: solution.description,
          isManaged: solution.ismanaged,
          publisher: {
            friendlyName: solution.publisherid?.friendlyname,
            uniqueName: solution.publisherid?.uniquename,
            customizationPrefix: solution.publisherid?.customizationprefix
          }
        }));

        return {
          content: [
            {
              type: "text",
              text: `Found ${solutionList.length} solutions:\n\n${JSON.stringify(solutionList, null, 2)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error listing solutions: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function listPublishersTool(server: McpServer, client: DataverseClient) {
  server.registerTool(
    "list_dataverse_publishers",
    {
      title: "List Dataverse Publishers",
      description: "Retrieves a list of publishers in the Dataverse environment with filtering options. Use this to discover available publishers, find custom publishers for solution creation, or get an overview of publisher configurations including customization prefixes.",
      inputSchema: {
        customOnly: z.boolean().default(true).describe("Whether to list only custom publishers"),
        top: z.number().optional().describe("Maximum number of publishers to return")
      }
    },
    async (params) => {
      try {
        let queryParams: Record<string, any> = {
          $select: "friendlyname,uniquename,customizationprefix,customizationoptionvalueprefix,description,isreadonly"
        };

        let filters: string[] = [];
        
        if (params.customOnly) {
          filters.push("isreadonly eq false");
        }

        if (filters.length > 0) {
          queryParams.$filter = filters.join(" and ");
        }

        if (params.top) {
          queryParams.$top = params.top;
        }

        const result = await client.get('publishers', queryParams);

        const publisherList = result.value.map((publisher: any) => ({
          friendlyName: publisher.friendlyname,
          uniqueName: publisher.uniquename,
          customizationPrefix: publisher.customizationprefix,
          customizationOptionValuePrefix: publisher.customizationoptionvalueprefix,
          description: publisher.description,
          isReadOnly: publisher.isreadonly
        }));

        return {
          content: [
            {
              type: "text",
              text: `Found ${publisherList.length} publishers:\n\n${JSON.stringify(publisherList, null, 2)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error listing publishers: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}
export function setSolutionContextTool(server: McpServer, client: DataverseClient) {
  server.registerTool(
    "set_solution_context",
    {
      title: "Set Solution Context",
      description: "Sets the active solution context for all subsequent metadata operations. When a solution context is set, all created tables, columns, relationships, and other components will be automatically added to this solution. This is required before creating any custom components.",
      inputSchema: {
        solutionUniqueName: z.string().describe("Unique name of the solution to set as context for subsequent operations")
      }
    },
    async (params) => {
      try {
        await client.setSolutionContext(params.solutionUniqueName);
        const context = client.getSolutionContext();

        if (!context) {
          throw new Error('Failed to set solution context');
        }

        return {
          content: [
            {
              type: "text",
              text: `Solution context set to '${context.solutionUniqueName}' (${context.solutionDisplayName}). All subsequent metadata operations will be associated with this solution.\n\nPublisher: ${context.publisherDisplayName} (${context.publisherUniqueName})\nPrefix: ${context.customizationPrefix}\n\nContext has been persisted to .mcp-dataverse file.`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error setting solution context: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function getSolutionContextTool(server: McpServer, client: DataverseClient) {
  server.registerTool(
    "get_solution_context",
    {
      title: "Get Solution Context",
      description: "Retrieves the currently active solution context information. Use this to check which solution is currently set for metadata operations and to verify the customization prefix being used for new components.",
      inputSchema: {}
    },
    async () => {
      try {
        const currentContext = client.getSolutionContext();
        
        if (!currentContext) {
          return {
            content: [
              {
                type: "text",
                text: "No solution context is currently set. Metadata operations will not be associated with any specific solution."
              }
            ]
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Current solution context: '${currentContext.solutionUniqueName}' (${currentContext.solutionDisplayName})\n\nPublisher: ${currentContext.publisherDisplayName} (${currentContext.publisherUniqueName})\nPrefix: ${currentContext.customizationPrefix}\n\nAll metadata operations will be associated with this solution.\nLast updated: ${currentContext.lastUpdated}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting solution context: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function clearSolutionContextTool(server: McpServer, client: DataverseClient) {
  server.registerTool(
    "clear_solution_context",
    {
      title: "Clear Solution Context",
      description: "Clears the currently active solution context. After clearing, metadata operations will not be associated with any specific solution. Use this when you want to work without a solution context or before switching to a different solution.",
      inputSchema: {}
    },
    async () => {
      try {
        const previousContext = client.getSolutionContext();
        client.clearSolutionContext();

        return {
          content: [
            {
              type: "text",
              text: previousContext
                ? `Solution context cleared. Previously set to '${previousContext.solutionUniqueName}'. Metadata operations will no longer be associated with any specific solution.\n\n.mcp-dataverse file has been removed.`
                : "Solution context cleared (no context was previously set)."
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error clearing solution context: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}