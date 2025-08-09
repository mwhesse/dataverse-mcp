import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DataverseClient } from "../dataverse-client.js";

export function createTeamTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "create_dataverse_team",
    {
      name: z.string().max(160).describe("Name of the team"),
      description: z.string().max(2000).optional().describe("Description of the team"),
      businessUnitId: z.string().optional().describe("Business unit ID to associate the team with (defaults to root business unit)"),
      administratorId: z.string().describe("User ID of the team administrator"),
      teamType: z.enum(['0', '1', '2', '3']).default('0').describe("Team type: 0=Owner, 1=Access, 2=Security Group, 3=Office Group"),
      membershipType: z.enum(['0', '1', '2', '3']).default('0').describe("Membership type: 0=Members and guests, 1=Members, 2=Owners, 3=Guests"),
      emailAddress: z.string().max(100).optional().describe("Email address for the team"),
      yomiName: z.string().max(160).optional().describe("Pronunciation of the team name in phonetic characters"),
      azureActiveDirectoryObjectId: z.string().optional().describe("Azure AD Object ID for the team"),
      queueId: z.string().optional().describe("Default queue ID for the team"),
      teamTemplateId: z.string().optional().describe("Team template ID to associate with the team"),
      delegatedAuthorizationId: z.string().optional().describe("Delegated authorization context for the team"),
      transactionCurrencyId: z.string().optional().describe("Currency ID associated with the team")
    },
    async (params) => {
      try {
        const teamData: any = {
          name: params.name,
          description: params.description,
          teamtype: parseInt(params.teamType),
          membershiptype: parseInt(params.membershipType),
          emailaddress: params.emailAddress,
          yominame: params.yomiName,
          azureactivedirectoryobjectid: params.azureActiveDirectoryObjectId
        };

        // Set administrator
        teamData['administratorid@odata.bind'] = `/systemusers(${params.administratorId})`;

        // Set business unit (default to root if not provided)
        if (params.businessUnitId) {
          teamData['businessunitid@odata.bind'] = `/businessunits(${params.businessUnitId})`;
        } else {
          // Get the root business unit
          const businessUnits = await client.get('businessunits?$filter=parentbusinessunitid eq null&$select=businessunitid');
          
          if (businessUnits.value && businessUnits.value.length > 0) {
            teamData['businessunitid@odata.bind'] = `/businessunits(${businessUnits.value[0].businessunitid})`;
          }
        }

        // Set optional relationships
        if (params.queueId) {
          teamData['queueid@odata.bind'] = `/queues(${params.queueId})`;
        }
        if (params.teamTemplateId) {
          teamData['teamtemplateid@odata.bind'] = `/teamtemplates(${params.teamTemplateId})`;
        }
        if (params.delegatedAuthorizationId) {
          teamData['delegatedauthorizationid@odata.bind'] = `/delegatedauthorizations(${params.delegatedAuthorizationId})`;
        }
        if (params.transactionCurrencyId) {
          teamData['transactioncurrencyid@odata.bind'] = `/transactioncurrencies(${params.transactionCurrencyId})`;
        }

        const response = await client.post('teams', teamData);
        
        return {
          content: [
            {
              type: "text",
              text: `Successfully created team '${params.name}'.\n\nTeam created successfully.\n\nResponse: ${JSON.stringify(response, null, 2)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error creating team: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function getTeamTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "get_dataverse_team",
    {
      teamId: z.string().describe("ID of the team to retrieve")
    },
    async (params) => {
      try {
        const team = await client.get(`teams(${params.teamId})?$select=teamid,name,description,teamtype,membershiptype,emailaddress,yominame,azureactivedirectoryobjectid,businessunitid,administratorid,queueid,delegatedauthorizationid,transactioncurrencyid,createdon,modifiedon,createdby,modifiedby,isdefault,systemmanaged&$expand=administratorid($select=fullname),businessunitid($select=name),createdby($select=fullname),modifiedby($select=fullname)`);

        const teamInfo = {
          teamId: team.teamid,
          name: team.name,
          description: team.description,
          teamType: team.teamtype,
          teamTypeLabel: getTeamTypeLabel(team.teamtype),
          membershipType: team.membershiptype,
          membershipTypeLabel: getMembershipTypeLabel(team.membershiptype),
          emailAddress: team.emailaddress,
          yomiName: team.yominame,
          azureActiveDirectoryObjectId: team.azureactivedirectoryobjectid,
          businessUnitId: team.businessunitid,
          businessUnitName: team.businessunitid?.name,
          administratorId: team.administratorid,
          administratorName: team.administratorid?.fullname,
          queueId: team.queueid,
          teamTemplateId: team.teamtemplateid,
          delegatedAuthorizationId: team.delegatedauthorizationid,
          transactionCurrencyId: team.transactioncurrencyid,
          createdOn: team.createdon,
          modifiedOn: team.modifiedon,
          createdBy: team.createdby?.fullname,
          modifiedBy: team.modifiedby?.fullname,
          isDefault: team.isdefault,
          systemManaged: team.systemmanaged
        };

        return {
          content: [
            {
              type: "text",
              text: `Team information:\n\n${JSON.stringify(teamInfo, null, 2)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error retrieving team: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function updateTeamTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "update_dataverse_team",
    {
      teamId: z.string().describe("ID of the team to update"),
      name: z.string().max(160).optional().describe("New name of the team"),
      description: z.string().max(2000).optional().describe("New description of the team"),
      teamType: z.enum(['0', '1', '2', '3']).optional().describe("Team type: 0=Owner, 1=Access, 2=Security Group, 3=Office Group"),
      membershipType: z.enum(['0', '1', '2', '3']).optional().describe("Membership type: 0=Members and guests, 1=Members, 2=Owners, 3=Guests"),
      emailAddress: z.string().max(100).optional().describe("Email address for the team"),
      yomiName: z.string().max(160).optional().describe("Pronunciation of the team name in phonetic characters"),
      azureActiveDirectoryObjectId: z.string().optional().describe("Azure AD Object ID for the team"),
      administratorId: z.string().optional().describe("New administrator user ID"),
      queueId: z.string().optional().describe("Default queue ID for the team"),
      teamTemplateId: z.string().optional().describe("Team template ID to associate with the team"),
      delegatedAuthorizationId: z.string().optional().describe("Delegated authorization context for the team"),
      transactionCurrencyId: z.string().optional().describe("Currency ID associated with the team")
    },
    async (params) => {
      try {
        const updateData: any = {};

        if (params.name !== undefined) updateData.name = params.name;
        if (params.description !== undefined) updateData.description = params.description;
        if (params.teamType !== undefined) updateData.teamtype = parseInt(params.teamType);
        if (params.membershipType !== undefined) updateData.membershiptype = parseInt(params.membershipType);
        if (params.emailAddress !== undefined) updateData.emailaddress = params.emailAddress;
        if (params.yomiName !== undefined) updateData.yominame = params.yomiName;
        if (params.azureActiveDirectoryObjectId !== undefined) updateData.azureactivedirectoryobjectid = params.azureActiveDirectoryObjectId;

        // Set optional relationships
        if (params.administratorId !== undefined) {
          updateData['administratorid@odata.bind'] = `/systemusers(${params.administratorId})`;
        }
        if (params.queueId !== undefined) {
          updateData['queueid@odata.bind'] = params.queueId ? `/queues(${params.queueId})` : null;
        }
        if (params.teamTemplateId !== undefined) {
          updateData['teamtemplateid@odata.bind'] = params.teamTemplateId ? `/teamtemplates(${params.teamTemplateId})` : null;
        }
        if (params.delegatedAuthorizationId !== undefined) {
          updateData['delegatedauthorizationid@odata.bind'] = params.delegatedAuthorizationId ? `/delegatedauthorizations(${params.delegatedAuthorizationId})` : null;
        }
        if (params.transactionCurrencyId !== undefined) {
          updateData['transactioncurrencyid@odata.bind'] = params.transactionCurrencyId ? `/transactioncurrencies(${params.transactionCurrencyId})` : null;
        }

        await client.patch(`teams(${params.teamId})`, updateData);

        return {
          content: [
            {
              type: "text",
              text: `Successfully updated team.`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error updating team: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function deleteTeamTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "delete_dataverse_team",
    {
      teamId: z.string().describe("ID of the team to delete")
    },
    async (params) => {
      try {
        await client.delete(`teams(${params.teamId})`);

        return {
          content: [
            {
              type: "text",
              text: `Successfully deleted team.`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error deleting team: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function listTeamsTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "list_dataverse_teams",
    {
      businessUnitId: z.string().optional().describe("Filter teams by business unit ID"),
      teamType: z.enum(['0', '1', '2', '3']).optional().describe("Filter by team type: 0=Owner, 1=Access, 2=Security Group, 3=Office Group"),
      systemManagedOnly: z.boolean().default(false).describe("Whether to list only system-managed teams"),
      excludeDefault: z.boolean().default(false).describe("Whether to exclude default business unit teams"),
      top: z.number().optional().describe("Maximum number of teams to return (default: 50)"),
      filter: z.string().optional().describe("OData filter expression")
    },
    async (params) => {
      try {
        let queryParams: Record<string, any> = {
          $select: 'teamid,name,description,teamtype,membershiptype,emailaddress,businessunitid,administratorid,isdefault,systemmanaged,createdon',
          $expand: 'administratorid($select=fullname),businessunitid($select=name)',
          $top: params.top || 50
        };

        const filters: string[] = [];

        if (params.businessUnitId) {
          filters.push(`businessunitid eq ${params.businessUnitId}`);
        }

        if (params.teamType !== undefined) {
          filters.push(`teamtype eq ${parseInt(params.teamType)}`);
        }

        if (params.systemManagedOnly) {
          filters.push(`systemmanaged eq true`);
        }

        if (params.excludeDefault) {
          filters.push(`isdefault eq false`);
        }

        if (params.filter) {
          filters.push(params.filter);
        }

        if (filters.length > 0) {
          queryParams.$filter = filters.join(' and ');
        }

        const response = await client.get('teams', queryParams);

        const teams = response.value?.map((team: any) => ({
          teamId: team.teamid,
          name: team.name,
          description: team.description,
          teamType: team.teamtype,
          teamTypeLabel: getTeamTypeLabel(team.teamtype),
          membershipType: team.membershiptype,
          membershipTypeLabel: getMembershipTypeLabel(team.membershiptype),
          emailAddress: team.emailaddress,
          businessUnitId: team.businessunitid,
          businessUnitName: team.businessunitid?.name,
          administratorId: team.administratorid,
          administratorName: team.administratorid?.fullname,
          isDefault: team.isdefault,
          systemManaged: team.systemmanaged,
          createdOn: team.createdon
        })) || [];

        return {
          content: [
            {
              type: "text",
              text: `Found ${teams.length} teams:\n\n${JSON.stringify(teams, null, 2)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error listing teams: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function addMembersToTeamTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "add_members_to_team",
    {
      teamId: z.string().describe("ID of the team to add members to"),
      memberIds: z.array(z.string()).describe("Array of user IDs to add as team members")
    },
    async (params) => {
      try {
        await client.callAction('AddMembersTeam', {
          TeamId: params.teamId,
          MemberIds: params.memberIds
        });

        return {
          content: [
            {
              type: "text",
              text: `Successfully added ${params.memberIds.length} member(s) to team.`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error adding members to team: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function removeMembersFromTeamTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "remove_members_from_team",
    {
      teamId: z.string().describe("ID of the team to remove members from"),
      memberIds: z.array(z.string()).describe("Array of user IDs to remove from team")
    },
    async (params) => {
      try {
        await client.callAction('RemoveMembersTeam', {
          TeamId: params.teamId,
          MemberIds: params.memberIds
        });

        return {
          content: [
            {
              type: "text",
              text: `Successfully removed ${params.memberIds.length} member(s) from team.`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error removing members from team: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function getTeamMembersTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "get_team_members",
    {
      teamId: z.string().describe("ID of the team to retrieve members for")
    },
    async (params) => {
      try {
        // Get team members through the many-to-many relationship
        const response = await client.get(`teams(${params.teamId})/teammembership_association?$select=systemuserid,fullname,domainname,businessunitid,isdisabled&$expand=businessunitid($select=name)`);

        const members = response.value?.map((member: any) => ({
          userId: member.systemuserid,
          fullName: member.fullname,
          domainName: member.domainname,
          businessUnitId: member.businessunitid,
          businessUnitName: member.businessunitid?.name,
          isDisabled: member.isdisabled
        })) || [];

        return {
          content: [
            {
              type: "text",
              text: `Team has ${members.length} member(s):\n\n${JSON.stringify(members, null, 2)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error retrieving team members: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function convertOwnerTeamToAccessTeamTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "convert_owner_team_to_access_team",
    {
      teamId: z.string().describe("ID of the owner team to convert to access team")
    },
    async (params) => {
      try {
        await client.callAction('ConvertOwnerTeamToAccessTeam', {
          TeamId: params.teamId
        });

        return {
          content: [
            {
              type: "text",
              text: `Successfully converted owner team to access team.`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error converting team: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

// Helper functions
function getTeamTypeLabel(teamType: number): string {
  switch (teamType) {
    case 0: return 'Owner';
    case 1: return 'Access';
    case 2: return 'Security Group';
    case 3: return 'Office Group';
    default: return 'Unknown';
  }
}

function getMembershipTypeLabel(membershipType: number): string {
  switch (membershipType) {
    case 0: return 'Members and guests';
    case 1: return 'Members';
    case 2: return 'Owners';
    case 3: return 'Guests';
    default: return 'Unknown';
  }
}