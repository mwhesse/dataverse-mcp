import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DataverseClient } from "../dataverse-client.js";

function getDepthValue(depth: string): number {
  switch (depth) {
    case 'Basic': return 0;
    case 'Local': return 1;
    case 'Deep': return 2;
    case 'Global': return 3;
    default: return 0;
  }
}

export function createRoleTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "create_dataverse_role",
    {
      name: z.string().max(100).describe("Name of the security role"),
      description: z.string().max(2000).optional().describe("Description of the security role"),
      businessUnitId: z.string().optional().describe("Business unit ID to associate the role with (defaults to root business unit)"),
      appliesTo: z.string().max(2000).optional().describe("Personas/Licenses the security role applies to"),
      isAutoAssigned: z.boolean().default(false).describe("Whether the role is auto-assigned based on user license"),
      isInherited: z.enum(['0', '1']).default('1').describe("0 = Team privileges only, 1 = Direct User access level and Team privileges"),
      summaryOfCoreTablePermissions: z.string().max(2000).optional().describe("Summary of Core Table Permissions of the Role")
    },
    async (params) => {
      try {
        const roleData: any = {
          name: params.name,
          description: params.description || '',
          appliesto: params.appliesTo,
          isautoassigned: params.isAutoAssigned ? 1 : 0,
          isinherited: parseInt(params.isInherited),
          summaryofcoretablepermissions: params.summaryOfCoreTablePermissions
        };

        // If businessUnitId is provided, use it; otherwise, get the root business unit
        if (params.businessUnitId) {
          roleData['businessunitid@odata.bind'] = `/businessunits(${params.businessUnitId})`;
        } else {
          // Get the root business unit
          const businessUnits = await client.get('businessunits?$filter=parentbusinessunitid eq null&$select=businessunitid');
          
          if (businessUnits.value && businessUnits.value.length > 0) {
            roleData['businessunitid@odata.bind'] = `/businessunits(${businessUnits.value[0].businessunitid})`;
          }
        }

        const response = await client.post('roles', roleData);
        
        // The response might have the ID in different formats
        const roleId = response.roleid || response.id || response['@odata.id']?.split('(')[1]?.split(')')[0] || 'Created successfully';
        
        return {
          content: [
            {
              type: "text",
              text: `Successfully created security role '${params.name}'.\n\nRole ID: ${roleId}\n\nResponse: ${JSON.stringify(response, null, 2)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error creating security role: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function getRoleTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "get_dataverse_role",
    {
      roleId: z.string().describe("ID of the role to retrieve")
    },
    async (params) => {
      try {
        const role = await client.get(`roles(${params.roleId})?$select=roleid,name,description,appliesto,isautoassigned,isinherited,summaryofcoretablepermissions,businessunitid,createdon,modifiedon,createdby,modifiedby,ismanaged,iscustomizable,canbedeleted`);

        const roleInfo = {
          roleId: role.roleid,
          name: role.name,
          description: role.description,
          appliesTo: role.appliesto,
          isAutoAssigned: role.isautoassigned === 1,
          isInherited: role.isinherited,
          summaryOfCoreTablePermissions: role.summaryofcoretablepermissions,
          businessUnitId: role.businessunitid,
          createdOn: role.createdon,
          modifiedOn: role.modifiedon,
          createdBy: role.createdby,
          modifiedBy: role.modifiedby,
          isManaged: role.ismanaged,
          isCustomizable: role.iscustomizable,
          canBeDeleted: role.canbedeleted
        };

        return {
          content: [
            {
              type: "text",
              text: `Security role information:\n\n${JSON.stringify(roleInfo, null, 2)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error retrieving security role: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function updateRoleTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "update_dataverse_role",
    {
      roleId: z.string().describe("ID of the role to update"),
      name: z.string().max(100).optional().describe("New name of the security role"),
      description: z.string().max(2000).optional().describe("New description of the security role"),
      appliesTo: z.string().max(2000).optional().describe("New personas/licenses the security role applies to"),
      isAutoAssigned: z.boolean().optional().describe("Whether the role is auto-assigned based on user license"),
      isInherited: z.enum(['0', '1']).optional().describe("0 = Team privileges only, 1 = Direct User access level and Team privileges"),
      summaryOfCoreTablePermissions: z.string().max(2000).optional().describe("Summary of Core Table Permissions of the Role")
    },
    async (params) => {
      try {
        const updateData: any = {};

        if (params.name !== undefined) updateData.name = params.name;
        if (params.description !== undefined) updateData.description = params.description;
        if (params.appliesTo !== undefined) updateData.appliesto = params.appliesTo;
        if (params.isAutoAssigned !== undefined) updateData.isautoassigned = params.isAutoAssigned ? 1 : 0;
        if (params.isInherited !== undefined) updateData.isinherited = parseInt(params.isInherited);
        if (params.summaryOfCoreTablePermissions !== undefined) updateData.summaryofcoretablepermissions = params.summaryOfCoreTablePermissions;

        await client.patch(`roles(${params.roleId})`, updateData);

        return {
          content: [
            {
              type: "text",
              text: `Successfully updated security role.`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error updating security role: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function deleteRoleTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "delete_dataverse_role",
    {
      roleId: z.string().describe("ID of the role to delete")
    },
    async (params) => {
      try {
        await client.delete(`roles(${params.roleId})`);

        return {
          content: [
            {
              type: "text",
              text: `Successfully deleted security role.`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error deleting security role: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function listRolesTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "list_dataverse_roles",
    {
      businessUnitId: z.string().optional().describe("Filter roles by business unit ID"),
      customOnly: z.boolean().default(false).describe("Whether to list only custom (non-system) roles"),
      includeManaged: z.boolean().default(false).describe("Whether to include managed roles"),
      top: z.number().optional().describe("Maximum number of roles to return (default: 50)"),
      filter: z.string().optional().describe("OData filter expression")
    },
    async (params) => {
      try {
        let queryParams: Record<string, any> = {
          $select: 'roleid,name,description,appliesto,isautoassigned,isinherited,businessunitid,ismanaged,iscustomizable,canbedeleted',
          $top: params.top || 50
        };

        const filters: string[] = [];

        if (params.businessUnitId) {
          filters.push(`businessunitid eq ${params.businessUnitId}`);
        }

        if (params.customOnly) {
          filters.push(`iscustomizable/Value eq true`);
        }

        if (!params.includeManaged) {
          filters.push(`ismanaged eq false`);
        }

        if (params.filter) {
          filters.push(params.filter);
        }

        if (filters.length > 0) {
          queryParams.$filter = filters.join(' and ');
        }

        const response = await client.get('roles', queryParams);

        const roles = response.value?.map((role: any) => ({
          roleId: role.roleid,
          name: role.name,
          description: role.description,
          appliesTo: role.appliesto,
          isAutoAssigned: role.isautoassigned === 1,
          isInherited: role.isinherited,
          businessUnitId: role.businessunitid,
          isManaged: role.ismanaged,
          isCustomizable: role.iscustomizable,
          canBeDeleted: role.canbedeleted
        })) || [];

        return {
          content: [
            {
              type: "text",
              text: `Found ${roles.length} security roles:\n\n${JSON.stringify(roles, null, 2)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error listing security roles: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function addPrivilegesToRoleTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "add_privileges_to_role",
    {
      roleId: z.string().describe("ID of the role to add privileges to"),
      privileges: z.array(z.object({
        privilegeId: z.string().describe("ID of the privilege to add"),
        depth: z.enum(['Basic', 'Local', 'Deep', 'Global']).describe("Access level for the privilege")
      })).describe("Array of privileges to add to the role")
    },
    async (params) => {
      try {
        const privileges = params.privileges.map(p => ({
          PrivilegeId: p.privilegeId,
          Depth: getDepthValue(p.depth)
        }));

        await client.callAction('AddPrivilegesRole', {
          RoleId: params.roleId,
          Privileges: privileges
        });

        return {
          content: [
            {
              type: "text",
              text: `Successfully added ${privileges.length} privilege(s) to role.`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error adding privileges to role: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function removePrivilegeFromRoleTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "remove_privilege_from_role",
    {
      roleId: z.string().describe("ID of the role to remove privilege from"),
      privilegeId: z.string().describe("ID of the privilege to remove")
    },
    async (params) => {
      try {
        await client.callAction('RemovePrivilegeRole', {
          RoleId: params.roleId,
          PrivilegeId: params.privilegeId
        });

        return {
          content: [
            {
              type: "text",
              text: `Successfully removed privilege from role.`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error removing privilege from role: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function replaceRolePrivilegesTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "replace_role_privileges",
    {
      roleId: z.string().describe("ID of the role to replace privileges for"),
      privileges: z.array(z.object({
        privilegeId: z.string().describe("ID of the privilege"),
        depth: z.enum(['Basic', 'Local', 'Deep', 'Global']).describe("Access level for the privilege")
      })).describe("Array of privileges to replace existing privileges with")
    },
    async (params) => {
      try {
        const privileges = params.privileges.map(p => ({
          PrivilegeId: p.privilegeId,
          Depth: getDepthValue(p.depth)
        }));

        await client.callAction('ReplacePrivilegesRole', {
          RoleId: params.roleId,
          Privileges: privileges
        });

        return {
          content: [
            {
              type: "text",
              text: `Successfully replaced role privileges with ${privileges.length} privilege(s).`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error replacing role privileges: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function getRolePrivilegesTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "get_role_privileges",
    {
      roleId: z.string().describe("ID of the role to retrieve privileges for")
    },
    async (params) => {
      try {
        const response = await client.callAction('RetrieveRolePrivilegesRole', {
          RoleId: params.roleId
        });

        return {
          content: [
            {
              type: "text",
              text: `Role privileges:\n\n${JSON.stringify(response.RolePrivileges || [], null, 2)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error retrieving role privileges: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function assignRoleToUserTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "assign_role_to_user",
    {
      roleId: z.string().describe("ID of the role to assign"),
      userId: z.string().describe("ID of the user to assign the role to")
    },
    async (params) => {
      try {
        await client.post(`systemusers(${params.userId})/systemuserroles_association/$ref`, {
          "@odata.id": `${client['config'].dataverseUrl}/api/data/v9.2/roles(${params.roleId})`
        });

        return {
          content: [
            {
              type: "text",
              text: `Successfully assigned role to user.`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error assigning role to user: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function removeRoleFromUserTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "remove_role_from_user",
    {
      roleId: z.string().describe("ID of the role to remove"),
      userId: z.string().describe("ID of the user to remove the role from")
    },
    async (params) => {
      try {
        await client.delete(`systemusers(${params.userId})/systemuserroles_association(${params.roleId})/$ref`);

        return {
          content: [
            {
              type: "text",
              text: `Successfully removed role from user.`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error removing role from user: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function assignRoleToTeamTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "assign_role_to_team",
    {
      roleId: z.string().describe("ID of the role to assign"),
      teamId: z.string().describe("ID of the team to assign the role to")
    },
    async (params) => {
      try {
        await client.post(`teams(${params.teamId})/teamroles_association/$ref`, {
          "@odata.id": `${client['config'].dataverseUrl}/api/data/v9.2/roles(${params.roleId})`
        });

        return {
          content: [
            {
              type: "text",
              text: `Successfully assigned role to team.`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error assigning role to team: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function removeRoleFromTeamTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "remove_role_from_team",
    {
      roleId: z.string().describe("ID of the role to remove"),
      teamId: z.string().describe("ID of the team to remove the role from")
    },
    async (params) => {
      try {
        await client.delete(`teams(${params.teamId})/teamroles_association(${params.roleId})/$ref`);

        return {
          content: [
            {
              type: "text",
              text: `Successfully removed role from team.`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error removing role from team: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}