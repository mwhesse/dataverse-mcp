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

function getDepthName(depth: number): string {
  switch (depth) {
    case 0: return 'Basic';
    case 1: return 'Local';
    case 2: return 'Deep';
    case 3: return 'Global';
    default: return 'Unknown';
  }
}

export function createRoleTool(server: McpServer, client: DataverseClient) {
  server.registerTool(
    "create_dataverse_role",
    {
      title: "Create Dataverse Security Role",
      description: "Creates a new security role in Dataverse to define permissions and access levels for users and teams. Security roles control what users can see and do within the system. Use this to establish custom permission sets for different user types or job functions.",
      inputSchema: {
        name: z.string().max(100).describe("Name of the security role"),
        description: z.string().max(2000).optional().describe("Description of the security role"),
        businessUnitId: z.string().optional().describe("Business unit ID to associate the role with (defaults to root business unit)"),
        appliesTo: z.string().max(2000).optional().describe("Personas/Licenses the security role applies to"),
        isAutoAssigned: z.boolean().default(false).describe("Whether the role is auto-assigned based on user license"),
        isInherited: z.enum(['0', '1']).default('1').describe("0 = Team privileges only, 1 = Direct User access level and Team privileges"),
        summaryOfCoreTablePermissions: z.string().max(2000).optional().describe("Summary of Core Table Permissions of the Role")
      }
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
  server.registerTool(
    "get_dataverse_role",
    {
      title: "Get Dataverse Security Role",
      description: "Retrieves detailed information about a specific security role including its properties, business unit association, and configuration settings. Use this to inspect role definitions and understand permission structures.",
      inputSchema: {
        roleId: z.string().describe("ID of the role to retrieve")
      }
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
  server.registerTool(
    "update_dataverse_role",
    {
      title: "Update Dataverse Security Role",
      description: "Updates the properties and configuration of an existing security role. Use this to modify role settings like name, description, auto-assignment behavior, or inheritance settings without changing the actual privileges.",
      inputSchema: {
        roleId: z.string().describe("ID of the role to update"),
        name: z.string().max(100).optional().describe("New name of the security role"),
        description: z.string().max(2000).optional().describe("New description of the security role"),
        appliesTo: z.string().max(2000).optional().describe("New personas/licenses the security role applies to"),
        isAutoAssigned: z.boolean().optional().describe("Whether the role is auto-assigned based on user license"),
        isInherited: z.enum(['0', '1']).optional().describe("0 = Team privileges only, 1 = Direct User access level and Team privileges"),
        summaryOfCoreTablePermissions: z.string().max(2000).optional().describe("Summary of Core Table Permissions of the Role")
      }
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
  server.registerTool(
    "delete_dataverse_role",
    {
      title: "Delete Dataverse Security Role",
      description: "Permanently deletes a security role from Dataverse. WARNING: This action cannot be undone and will fail if the role is assigned to any users or teams. Ensure the role is not in use before deletion.",
      inputSchema: {
        roleId: z.string().describe("ID of the role to delete")
      }
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
  server.registerTool(
    "list_dataverse_roles",
    {
      title: "List Dataverse Security Roles",
      description: "Retrieves a list of security roles in the Dataverse environment with filtering options. Use this to discover available roles, find custom roles, or get an overview of permission structures. Supports filtering by business unit, custom/system roles, and managed/unmanaged status.",
      inputSchema: {
        businessUnitId: z.string().optional().describe("Filter roles by business unit ID"),
        customOnly: z.boolean().default(false).describe("Whether to list only custom (non-system) roles"),
        includeManaged: z.boolean().default(false).describe("Whether to include managed roles"),
        top: z.number().optional().describe("Maximum number of roles to return (default: 50)"),
        filter: z.string().optional().describe("OData filter expression")
      }
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
  server.registerTool(
    "add_privileges_to_role",
    {
      title: "Add Privileges to Dataverse Role",
      description: "Adds specific privileges with defined access levels to a security role. Use this to grant permissions for specific operations (create, read, write, delete, etc.) on entities or system functions. Each privilege can have different access levels (Basic, Local, Deep, Global).",
      inputSchema: {
        roleId: z.string().describe("ID of the role to add privileges to"),
        privileges: z.array(z.object({
          privilegeId: z.string().describe("ID of the privilege to add"),
          depth: z.enum(['Basic', 'Local', 'Deep', 'Global']).describe("Access level for the privilege")
        })).describe("Array of privileges to add to the role")
      }
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
  server.registerTool(
    "remove_privilege_from_role",
    {
      title: "Remove Privilege from Dataverse Role",
      description: "Removes a specific privilege from a security role, revoking the associated permissions. Use this to restrict access by removing specific operation permissions from a role.",
      inputSchema: {
        roleId: z.string().describe("ID of the role to remove privilege from"),
        privilegeId: z.string().describe("ID of the privilege to remove")
      }
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
  server.registerTool(
    "replace_role_privileges",
    {
      title: "Replace Dataverse Role Privileges",
      description: "Completely replaces all existing privileges in a security role with a new set of privileges. WARNING: This removes all current privileges and replaces them with the specified ones. Use this for comprehensive role permission restructuring.",
      inputSchema: {
        roleId: z.string().describe("ID of the role to replace privileges for"),
        privileges: z.array(z.object({
          privilegeId: z.string().describe("ID of the privilege"),
          depth: z.enum(['Basic', 'Local', 'Deep', 'Global']).describe("Access level for the privilege")
        })).describe("Array of privileges to replace existing privileges with")
      }
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
  server.registerTool(
    "get_role_privileges",
    {
      title: "Get Dataverse Role Privileges",
      description: "Retrieves all privileges currently assigned to a security role, showing what permissions the role grants. Use this to audit role permissions and understand what access a role provides to users and teams.",
      inputSchema: {
        roleId: z.string().describe("ID of the role to retrieve privileges for")
      }
    },
    async (params) => {
      try {
        // Get role privileges using the correct Web API approach from Microsoft documentation
        // Using $expand to get the roleprivileges_association collection
        const response = await client.get(`roles(${params.roleId})?$select=roleid&$expand=roleprivileges_association($select=name,privilegeid)&$orderby=name`);

        const rolePrivileges = response.roleprivileges_association || [];
        const privileges = rolePrivileges.map((privilege: any) => ({
          privilegeId: privilege.privilegeid,
          privilegeName: privilege.name
        }));

        return {
          content: [
            {
              type: "text",
              text: `Role privileges (${privileges.length} found):\n\n${JSON.stringify(privileges, null, 2)}`
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
  server.registerTool(
    "assign_role_to_user",
    {
      title: "Assign Role to User",
      description: "Assigns a security role to a specific user, granting them all the permissions defined in that role. Use this to provide users with the appropriate access levels for their job functions and responsibilities.",
      inputSchema: {
        roleId: z.string().describe("ID of the role to assign"),
        userId: z.string().describe("ID of the user to assign the role to")
      }
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
  server.registerTool(
    "remove_role_from_user",
    {
      title: "Remove Role from User",
      description: "Removes a security role assignment from a specific user, revoking the permissions granted by that role. Use this when users change roles or no longer need certain access levels.",
      inputSchema: {
        roleId: z.string().describe("ID of the role to remove"),
        userId: z.string().describe("ID of the user to remove the role from")
      }
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
  server.registerTool(
    "assign_role_to_team",
    {
      title: "Assign Role to Team",
      description: "Assigns a security role to a team, granting all team members the permissions defined in that role. Use this to provide consistent access levels to groups of users working together on similar tasks.",
      inputSchema: {
        roleId: z.string().describe("ID of the role to assign"),
        teamId: z.string().describe("ID of the team to assign the role to")
      }
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
  server.registerTool(
    "remove_role_from_team",
    {
      title: "Remove Role from Team",
      description: "Removes a security role assignment from a team, revoking the permissions granted by that role for all team members. Use this when teams no longer need certain access levels or when restructuring team permissions.",
      inputSchema: {
        roleId: z.string().describe("ID of the role to remove"),
        teamId: z.string().describe("ID of the team to remove the role from")
      }
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