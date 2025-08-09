import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DataverseClient } from "../dataverse-client.js";
import { OneToManyRelationshipMetadata, ManyToManyRelationshipMetadata, ODataResponse, LocalizedLabel } from "../types.js";

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

export function createRelationshipTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "create_dataverse_relationship",
    {
      relationshipType: z.enum(["OneToMany", "ManyToMany"]).describe("Type of relationship to create"),
      schemaName: z.string().describe("Schema name for the relationship (e.g., 'new_account_contact')"),
      
      // One-to-Many specific fields
      referencedEntity: z.string().optional().describe("Referenced (parent) entity logical name for One-to-Many relationships"),
      referencingEntity: z.string().optional().describe("Referencing (child) entity logical name for One-to-Many relationships"),
      referencingAttributeLogicalName: z.string().optional().describe("Logical name for the lookup attribute to be created"),
      referencingAttributeDisplayName: z.string().optional().describe("Display name for the lookup attribute"),
      
      // Many-to-Many specific fields
      entity1LogicalName: z.string().optional().describe("First entity logical name for Many-to-Many relationships"),
      entity2LogicalName: z.string().optional().describe("Second entity logical name for Many-to-Many relationships"),
      intersectEntityName: z.string().optional().describe("Name for the intersect entity (auto-generated if not provided)"),
      
      // Cascade configuration for One-to-Many
      cascadeAssign: z.enum(["NoCascade", "Cascade", "Active", "UserOwned", "RemoveLink", "Restrict"]).default("NoCascade").describe("Cascade behavior for assign operations"),
      cascadeDelete: z.enum(["NoCascade", "Cascade", "Active", "UserOwned", "RemoveLink", "Restrict"]).default("RemoveLink").describe("Cascade behavior for delete operations"),
      cascadeMerge: z.enum(["NoCascade", "Cascade", "Active", "UserOwned", "RemoveLink", "Restrict"]).default("NoCascade").describe("Cascade behavior for merge operations"),
      cascadeReparent: z.enum(["NoCascade", "Cascade", "Active", "UserOwned", "RemoveLink", "Restrict"]).default("NoCascade").describe("Cascade behavior for reparent operations"),
      cascadeShare: z.enum(["NoCascade", "Cascade", "Active", "UserOwned", "RemoveLink", "Restrict"]).default("NoCascade").describe("Cascade behavior for share operations"),
      cascadeUnshare: z.enum(["NoCascade", "Cascade", "Active", "UserOwned", "RemoveLink", "Restrict"]).default("NoCascade").describe("Cascade behavior for unshare operations"),
      
      // Associated menu configuration
      menuBehavior: z.enum(["UseCollectionName", "UseLabel", "DoNotDisplay"]).default("UseCollectionName").describe("How the relationship appears in associated menus"),
      menuGroup: z.enum(["Details", "Sales", "Service", "Marketing"]).default("Details").describe("Menu group for the relationship"),
      menuLabel: z.string().optional().describe("Custom label for the menu (required if menuBehavior is UseLabel)"),
      menuOrder: z.number().optional().describe("Order in the menu"),
      
      isValidForAdvancedFind: z.boolean().default(true).describe("Whether the relationship is valid for Advanced Find"),
      isHierarchical: z.boolean().default(false).describe("Whether this is a hierarchical relationship (One-to-Many only)")
    },
    async (params) => {
      try {
        if (params.relationshipType === "OneToMany") {
          if (!params.referencedEntity || !params.referencingEntity || !params.referencingAttributeLogicalName || !params.referencingAttributeDisplayName) {
            throw new Error("For One-to-Many relationships, referencedEntity, referencingEntity, referencingAttributeLogicalName, and referencingAttributeDisplayName are required");
          }

          const cascadeConfig = {
            Assign: getCascadeValue(params.cascadeAssign),
            Delete: getCascadeValue(params.cascadeDelete),
            Merge: getCascadeValue(params.cascadeMerge),
            Reparent: getCascadeValue(params.cascadeReparent),
            Share: getCascadeValue(params.cascadeShare),
            Unshare: getCascadeValue(params.cascadeUnshare),
            RollupView: "NoCascade"
          };

          const menuConfig = {
            Behavior: getMenuBehaviorValue(params.menuBehavior),
            Group: getMenuGroupValue(params.menuGroup),
            Label: params.menuLabel ? createLocalizedLabel(params.menuLabel) : undefined,
            Order: params.menuOrder
          };

          const relationshipDefinition = {
            "@odata.type": "Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata",
            SchemaName: params.schemaName,
            ReferencedEntity: params.referencedEntity,
            ReferencingEntity: params.referencingEntity,
            CascadeConfiguration: cascadeConfig,
            AssociatedMenuConfiguration: menuConfig,
            IsValidForAdvancedFind: params.isValidForAdvancedFind,
            IsHierarchical: params.isHierarchical,
            IsCustomRelationship: true,
            Lookup: {
              "@odata.type": "Microsoft.Dynamics.CRM.LookupAttributeMetadata",
              LogicalName: params.referencingAttributeLogicalName,
              SchemaName: params.referencingAttributeLogicalName.charAt(0).toUpperCase() + params.referencingAttributeLogicalName.slice(1),
              DisplayName: createLocalizedLabel(params.referencingAttributeDisplayName),
              RequiredLevel: {
                Value: "None",
                CanBeChanged: true,
                ManagedPropertyLogicalName: "canmodifyrequirementlevelsettings"
              },
              Targets: [params.referencedEntity],
              IsCustomAttribute: true
            }
          };

          const result = await client.postMetadata("RelationshipDefinitions", relationshipDefinition);

          return {
            content: [
              {
                type: "text",
                text: `Successfully created One-to-Many relationship '${params.schemaName}' between '${params.referencedEntity}' and '${params.referencingEntity}'.\n\nResponse: ${JSON.stringify(result, null, 2)}`
              }
            ]
          };

        } else { // ManyToMany
          if (!params.entity1LogicalName || !params.entity2LogicalName) {
            throw new Error("For Many-to-Many relationships, entity1LogicalName and entity2LogicalName are required");
          }

          const intersectName = params.intersectEntityName || `${params.entity1LogicalName}_${params.entity2LogicalName}`;

          const menuConfig1 = {
            Behavior: getMenuBehaviorValue(params.menuBehavior),
            Group: getMenuGroupValue(params.menuGroup),
            Label: params.menuLabel ? createLocalizedLabel(params.menuLabel) : undefined,
            Order: params.menuOrder
          };

          const menuConfig2 = {
            Behavior: getMenuBehaviorValue(params.menuBehavior),
            Group: getMenuGroupValue(params.menuGroup),
            Label: params.menuLabel ? createLocalizedLabel(params.menuLabel) : undefined,
            Order: params.menuOrder
          };

          const relationshipDefinition = {
            "@odata.type": "Microsoft.Dynamics.CRM.ManyToManyRelationshipMetadata",
            SchemaName: params.schemaName,
            Entity1LogicalName: params.entity1LogicalName,
            Entity1AssociatedMenuConfiguration: menuConfig1,
            Entity2LogicalName: params.entity2LogicalName,
            Entity2AssociatedMenuConfiguration: menuConfig2,
            IntersectEntityName: intersectName,
            IsValidForAdvancedFind: params.isValidForAdvancedFind,
            IsCustomRelationship: true
          };

          const result = await client.postMetadata("RelationshipDefinitions", relationshipDefinition);

          return {
            content: [
              {
                type: "text",
                text: `Successfully created Many-to-Many relationship '${params.schemaName}' between '${params.entity1LogicalName}' and '${params.entity2LogicalName}'.\n\nResponse: ${JSON.stringify(result, null, 2)}`
              }
            ]
          };
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error creating relationship: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

function getCascadeValue(cascade: string): string {
  // Return the string value directly instead of numeric
  return cascade;
}

function getMenuBehaviorValue(behavior: string): string {
  // Return the string value directly instead of numeric
  return behavior;
}

function getMenuGroupValue(group: string): string {
  // Return the string value directly instead of numeric
  return group;
}

export function getRelationshipTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "get_dataverse_relationship",
    {
      schemaName: z.string().describe("Schema name of the relationship to retrieve")
    },
    async (params) => {
      try {
        const result = await client.getMetadata(
          `RelationshipDefinitions(SchemaName='${params.schemaName}')`
        );

        return {
          content: [
            {
              type: "text",
              text: `Relationship information for '${params.schemaName}':\n\n${JSON.stringify(result, null, 2)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error retrieving relationship: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function deleteRelationshipTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "delete_dataverse_relationship",
    {
      schemaName: z.string().describe("Schema name of the relationship to delete")
    },
    async (params) => {
      try {
        await client.deleteMetadata(`RelationshipDefinitions(SchemaName='${params.schemaName}')`);

        return {
          content: [
            {
              type: "text",
              text: `Successfully deleted relationship '${params.schemaName}'.`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error deleting relationship: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function listRelationshipsTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "list_dataverse_relationships",
    {
      entityLogicalName: z.string().optional().describe("Filter relationships for a specific entity"),
      relationshipType: z.enum(["OneToMany", "ManyToMany", "All"]).default("All").describe("Type of relationships to list"),
      customOnly: z.boolean().default(false).describe("Whether to list only custom relationships"),
      includeManaged: z.boolean().default(false).describe("Whether to include managed relationships"),
      filter: z.string().optional().describe("OData filter expression")
    },
    async (params) => {
      try {
        let allRelationships: (OneToManyRelationshipMetadata | ManyToManyRelationshipMetadata)[] = [];

        // Build base filters
        const baseFilters = [];
        if (params.customOnly) {
          baseFilters.push("IsCustomRelationship eq true");
        }
        if (!params.includeManaged) {
          baseFilters.push("IsManaged eq false");
        }
        if (params.filter) {
          baseFilters.push(params.filter);
        }

        // Handle different relationship type scenarios using the correct cast syntax
        if (params.relationshipType === "OneToMany" || params.relationshipType === "All") {
          // Query OneToMany relationships using cast syntax
          const oneToManyFilters = [...baseFilters];
          if (params.entityLogicalName) {
            oneToManyFilters.push(`(ReferencedEntity eq '${params.entityLogicalName}' or ReferencingEntity eq '${params.entityLogicalName}')`);
          }

          const oneToManyParams: Record<string, any> = {
            $select: "SchemaName,RelationshipType,IsCustomRelationship,IsManaged,IsValidForAdvancedFind,ReferencedEntity,ReferencingEntity,ReferencingAttribute,IsHierarchical"
          };
          
          if (oneToManyFilters.length > 0) {
            oneToManyParams.$filter = oneToManyFilters.join(" and ");
          }


          const oneToManyResult = await client.getMetadata<ODataResponse<OneToManyRelationshipMetadata>>(
            "RelationshipDefinitions/Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata",
            oneToManyParams
          );
          allRelationships.push(...oneToManyResult.value);
        }

        if (params.relationshipType === "ManyToMany" || params.relationshipType === "All") {
          // Query ManyToMany relationships using cast syntax
          const manyToManyFilters = [...baseFilters];
          if (params.entityLogicalName) {
            manyToManyFilters.push(`(Entity1LogicalName eq '${params.entityLogicalName}' or Entity2LogicalName eq '${params.entityLogicalName}')`);
          }

          const manyToManyParams: Record<string, any> = {
            $select: "SchemaName,RelationshipType,IsCustomRelationship,IsManaged,IsValidForAdvancedFind,Entity1LogicalName,Entity2LogicalName,IntersectEntityName"
          };
          
          if (manyToManyFilters.length > 0) {
            manyToManyParams.$filter = manyToManyFilters.join(" and ");
          }


          const manyToManyResult = await client.getMetadata<ODataResponse<ManyToManyRelationshipMetadata>>(
            "RelationshipDefinitions/Microsoft.Dynamics.CRM.ManyToManyRelationshipMetadata",
            manyToManyParams
          );
          allRelationships.push(...manyToManyResult.value);
        }

        // Note: $top parameter is not supported by Dataverse metadata endpoints

        const relationshipList = allRelationships.map(relationship => {
          // Determine relationship type based on the presence of specific properties
          // rather than the RelationshipType enum value
          const isOneToMany = 'ReferencedEntity' in relationship && 'ReferencingEntity' in relationship;
          const relationshipType = isOneToMany ? "OneToMany" : "ManyToMany";
          
          const baseInfo = {
            schemaName: relationship.SchemaName,
            relationshipType: relationshipType,
            isCustom: relationship.IsCustomRelationship,
            isManaged: relationship.IsManaged,
            isValidForAdvancedFind: relationship.IsValidForAdvancedFind
          };

          if (isOneToMany) {
            // OneToMany
            const oneToMany = relationship as OneToManyRelationshipMetadata;
            return {
              ...baseInfo,
              referencedEntity: oneToMany.ReferencedEntity,
              referencingEntity: oneToMany.ReferencingEntity,
              referencingAttribute: oneToMany.ReferencingAttribute,
              isHierarchical: oneToMany.IsHierarchical
            };
          } else {
            // ManyToMany
            const manyToMany = relationship as ManyToManyRelationshipMetadata;
            return {
              ...baseInfo,
              entity1LogicalName: manyToMany.Entity1LogicalName,
              entity2LogicalName: manyToMany.Entity2LogicalName,
              intersectEntityName: manyToMany.IntersectEntityName
            };
          }
        });

        return {
          content: [
            {
              type: "text",
              text: `Found ${relationshipList.length} relationships${params.entityLogicalName ? ` for entity '${params.entityLogicalName}'` : ''}:\n\n${JSON.stringify(relationshipList, null, 2)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error listing relationships: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}