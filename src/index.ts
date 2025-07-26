#!/usr/bin/env node
import dotenv from 'dotenv';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { DataverseClient } from "./dataverse-client.js";

// Load environment variables from .env file
dotenv.config();
import { 
  createTableTool,
  getTableTool,
  updateTableTool,
  deleteTableTool,
  listTablesTool
} from "./tools/table-tools.js";
import {
  createColumnTool,
  getColumnTool,
  updateColumnTool,
  deleteColumnTool,
  listColumnsTool
} from "./tools/column-tools.js";
import {
  createRelationshipTool,
  getRelationshipTool,
  deleteRelationshipTool,
  listRelationshipsTool
} from "./tools/relationship-tools.js";
import {
  createOptionSetTool,
  getOptionSetTool,
  updateOptionSetTool,
  deleteOptionSetTool,
  listOptionSetsTool,
  getOptionSetOptionsTool
} from "./tools/optionset-tools.js";
import {
  createPublisherTool,
  createSolutionTool,
  getSolutionTool,
  getPublisherTool,
  listSolutionsTool,
  listPublishersTool,
  setSolutionContextTool,
  getSolutionContextTool,
  clearSolutionContextTool
} from "./tools/solution-tools.js";
import {
  createRoleTool,
  getRoleTool,
  updateRoleTool,
  deleteRoleTool,
  listRolesTool,
  addPrivilegesToRoleTool,
  removePrivilegeFromRoleTool,
  replaceRolePrivilegesTool,
  getRolePrivilegesTool,
  assignRoleToUserTool,
  removeRoleFromUserTool,
  assignRoleToTeamTool,
  removeRoleFromTeamTool
} from "./tools/role-tools.js";
import {
  createTeamTool,
  getTeamTool,
  updateTeamTool,
  deleteTeamTool,
  listTeamsTool,
  addMembersToTeamTool,
  removeMembersFromTeamTool,
  getTeamMembersTool,
  convertOwnerTeamToAccessTeamTool
} from "./tools/team-tools.js";

// Environment variables for Dataverse authentication
const DATAVERSE_URL = process.env.DATAVERSE_URL;
const CLIENT_ID = process.env.DATAVERSE_CLIENT_ID;
const CLIENT_SECRET = process.env.DATAVERSE_CLIENT_SECRET;
const TENANT_ID = process.env.DATAVERSE_TENANT_ID;

if (!DATAVERSE_URL || !CLIENT_ID || !CLIENT_SECRET || !TENANT_ID) {
  throw new Error('Missing required environment variables: DATAVERSE_URL, DATAVERSE_CLIENT_ID, DATAVERSE_CLIENT_SECRET, DATAVERSE_TENANT_ID');
}

// Create MCP server
const server = new McpServer({
  name: "dataverse-server",
  version: "0.1.0"
});

// Initialize Dataverse client
const dataverseClient = new DataverseClient({
  dataverseUrl: DATAVERSE_URL,
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  tenantId: TENANT_ID
});

// Register table tools
createTableTool(server, dataverseClient);
getTableTool(server, dataverseClient);
updateTableTool(server, dataverseClient);
deleteTableTool(server, dataverseClient);
listTablesTool(server, dataverseClient);

// Register column tools
createColumnTool(server, dataverseClient);
getColumnTool(server, dataverseClient);
updateColumnTool(server, dataverseClient);
deleteColumnTool(server, dataverseClient);
listColumnsTool(server, dataverseClient);

// Register relationship tools
createRelationshipTool(server, dataverseClient);
getRelationshipTool(server, dataverseClient);
deleteRelationshipTool(server, dataverseClient);
listRelationshipsTool(server, dataverseClient);

// Register option set tools
createOptionSetTool(server, dataverseClient);
getOptionSetTool(server, dataverseClient);
updateOptionSetTool(server, dataverseClient);
deleteOptionSetTool(server, dataverseClient);
listOptionSetsTool(server, dataverseClient);
getOptionSetOptionsTool(server, dataverseClient);

// Register solution and publisher tools
createPublisherTool(server, dataverseClient);
createSolutionTool(server, dataverseClient);
getSolutionTool(server, dataverseClient);
getPublisherTool(server, dataverseClient);
listSolutionsTool(server, dataverseClient);
listPublishersTool(server, dataverseClient);

// Register solution context tools
setSolutionContextTool(server, dataverseClient);
getSolutionContextTool(server, dataverseClient);
clearSolutionContextTool(server, dataverseClient);

// Register role tools
createRoleTool(server, dataverseClient);
getRoleTool(server, dataverseClient);
updateRoleTool(server, dataverseClient);
deleteRoleTool(server, dataverseClient);
listRolesTool(server, dataverseClient);

// Register role privilege tools
addPrivilegesToRoleTool(server, dataverseClient);
removePrivilegeFromRoleTool(server, dataverseClient);
replaceRolePrivilegesTool(server, dataverseClient);
getRolePrivilegesTool(server, dataverseClient);

// Register role assignment tools
assignRoleToUserTool(server, dataverseClient);
removeRoleFromUserTool(server, dataverseClient);
assignRoleToTeamTool(server, dataverseClient);
removeRoleFromTeamTool(server, dataverseClient);

// Register team tools
createTeamTool(server, dataverseClient);
getTeamTool(server, dataverseClient);
updateTeamTool(server, dataverseClient);
deleteTeamTool(server, dataverseClient);
listTeamsTool(server, dataverseClient);

// Register team membership tools
addMembersToTeamTool(server, dataverseClient);
removeMembersFromTeamTool(server, dataverseClient);
getTeamMembersTool(server, dataverseClient);
convertOwnerTeamToAccessTeamTool(server, dataverseClient);

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('Dataverse MCP server running on stdio');