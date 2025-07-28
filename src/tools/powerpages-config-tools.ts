import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DataverseClient } from "../dataverse-client.js";
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// Helper function to generate a new GUID
function generateGuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper function to read YAML file
function readYamlFile(filePath: string): any[] {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return yaml.load(content) as any[] || [];
    }
    return [];
  } catch (error) {
    console.error(`Error reading YAML file ${filePath}:`, error);
    return [];
  }
}

// Helper function to write YAML file
function writeYamlFile(filePath: string, data: any[]): void {
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const yamlContent = yaml.dump(data, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: false
    });
    fs.writeFileSync(filePath, yamlContent, 'utf8');
  } catch (error) {
    console.error(`Error writing YAML file ${filePath}:`, error);
    throw error;
  }
}

// Helper function to find PowerPages site directory
function findPowerPagesSiteDir(): string {
  const currentDir = process.cwd();
  const siteDir = path.join(currentDir, '.powerpages-site');
  
  if (!fs.existsSync(siteDir)) {
    throw new Error('.powerpages-site directory not found. This tool should be run from a PowerPages Code Site project root.');
  }
  
  return siteDir;
}

export function managePowerPagesWebAPIConfigTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "manage_powerpages_webapi_config",
    {
      operation: z.enum([
        "add_webapi_config", "remove_webapi_config", "list_webapi_configs", "add_table_permission", "remove_table_permission", "list_table_permissions", "check_config_status"
      ]).describe("Type of configuration operation to perform"),
      
      // WebAPI configuration parameters
      tableName: z.string().optional().describe("Logical name of the table (e.g., 'cr7ae_creditcardses', 'contacts')"),
      fields: z.string().default("*").describe("Fields to expose via WebAPI (default: '*' for all fields)"),
      
      // Table permission parameters
      permissionName: z.string().optional().describe("Name for the table permission"),
      webRoleName: z.string().default("Authenticated Users").describe("Web role name (default: 'Authenticated Users')"),
      accessType: z.enum(["Global", "Contact", "Account", "Parent"]).default("Global").describe("Access type for the permission"),
      privileges: z.array(z.enum(["Create", "Read", "Write", "Delete", "Append", "AppendTo"])).default(["Read"]).describe("Privileges to grant"),
      
      // General parameters
      projectPath: z.string().optional().describe("Path to PowerPages project (defaults to current directory)")
    },
    async (params) => {
      try {
        const projectPath = params.projectPath || process.cwd();
        const siteDir = path.join(projectPath, '.powerpages-site');
        
        if (!fs.existsSync(siteDir)) {
          throw new Error(`.powerpages-site directory not found at ${siteDir}. This tool should be run from a PowerPages Code Site project root.`);
        }
        
        const siteSettingsPath = path.join(siteDir, 'sitesetting.yml');
        const webRolesPath = path.join(siteDir, 'webrole.yml');
        const tablePermissionsDir = path.join(siteDir, 'table-permissions');
        
        let result = '';
        
        switch (params.operation) {
          case 'add_webapi_config':
            if (!params.tableName) {
              throw new Error('tableName is required for add_webapi_config operation');
            }
            
            result = await addWebAPIConfig(siteSettingsPath, params.tableName, params.fields);
            break;
            
          case 'remove_webapi_config':
            if (!params.tableName) {
              throw new Error('tableName is required for remove_webapi_config operation');
            }
            
            result = await removeWebAPIConfig(siteSettingsPath, params.tableName);
            break;
            
          case 'list_webapi_configs':
            result = await listWebAPIConfigs(siteSettingsPath);
            break;
            
          case 'add_table_permission':
            if (!params.tableName || !params.permissionName) {
              throw new Error('tableName and permissionName are required for add_table_permission operation');
            }
            
            result = await addTablePermission(
              tablePermissionsDir, 
              webRolesPath, 
              params.tableName, 
              params.permissionName, 
              params.webRoleName, 
              params.accessType, 
              params.privileges
            );
            break;
            
          case 'remove_table_permission':
            if (!params.permissionName) {
              throw new Error('permissionName is required for remove_table_permission operation');
            }
            
            result = await removeTablePermission(tablePermissionsDir, params.permissionName);
            break;
            
          case 'list_table_permissions':
            result = await listTablePermissions(tablePermissionsDir);
            break;
            
          case 'check_config_status':
            if (!params.tableName) {
              throw new Error('tableName is required for check_config_status operation');
            }
            
            result = await checkConfigStatus(siteSettingsPath, tablePermissionsDir, params.tableName);
            break;
            
          default:
            throw new Error(`Unsupported operation: ${params.operation}`);
        }
        
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
              text: `Error managing PowerPages configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

async function addWebAPIConfig(siteSettingsPath: string, tableName: string, fields: string): Promise<string> {
  const siteSettings = readYamlFile(siteSettingsPath);
  
  // Check if WebAPI settings already exist
  const enabledSetting = siteSettings.find(s => s.adx_name === `Webapi/${tableName}/enabled`);
  const fieldsSetting = siteSettings.find(s => s.adx_name === `Webapi/${tableName}/fields`);
  
  let addedSettings: string[] = [];
  
  if (!enabledSetting) {
    siteSettings.push({
      adx_name: `Webapi/${tableName}/enabled`,
      adx_sitesettingid: generateGuid(),
      adx_source: 0,
      adx_value: true
    });
    addedSettings.push(`Webapi/${tableName}/enabled`);
  }
  
  if (!fieldsSetting) {
    siteSettings.push({
      adx_name: `Webapi/${tableName}/fields`,
      adx_sitesettingid: generateGuid(),
      adx_source: 0,
      adx_value: fields
    });
    addedSettings.push(`Webapi/${tableName}/fields`);
  }
  
  if (addedSettings.length > 0) {
    writeYamlFile(siteSettingsPath, siteSettings);
    return `Successfully added WebAPI configuration for table '${tableName}':\n- ${addedSettings.join('\n- ')}\n\nNext steps:\n1. Add table permissions for this table\n2. Deploy the configuration using 'pac pages upload-code-site'`;
  } else {
    return `WebAPI configuration for table '${tableName}' already exists.`;
  }
}

async function removeWebAPIConfig(siteSettingsPath: string, tableName: string): Promise<string> {
  const siteSettings = readYamlFile(siteSettingsPath);
  
  const initialLength = siteSettings.length;
  const filteredSettings = siteSettings.filter(s => 
    s.adx_name !== `Webapi/${tableName}/enabled` && 
    s.adx_name !== `Webapi/${tableName}/fields`
  );
  
  if (filteredSettings.length < initialLength) {
    writeYamlFile(siteSettingsPath, filteredSettings);
    return `Successfully removed WebAPI configuration for table '${tableName}'.`;
  } else {
    return `No WebAPI configuration found for table '${tableName}'.`;
  }
}

async function listWebAPIConfigs(siteSettingsPath: string): Promise<string> {
  const siteSettings = readYamlFile(siteSettingsPath);
  
  const webApiSettings = siteSettings.filter(s => s.adx_name?.startsWith('Webapi/'));
  
  if (webApiSettings.length === 0) {
    return 'No WebAPI configurations found.';
  }
  
  // Group by table
  const tableConfigs: Record<string, any> = {};
  
  webApiSettings.forEach(setting => {
    const match = setting.adx_name.match(/^Webapi\/([^\/]+)\/(.+)$/);
    if (match) {
      const [, tableName, configType] = match;
      if (!tableConfigs[tableName]) {
        tableConfigs[tableName] = {};
      }
      tableConfigs[tableName][configType] = setting.adx_value;
    }
  });
  
  let result = 'WebAPI Configurations:\n\n';
  
  Object.entries(tableConfigs).forEach(([tableName, config]) => {
    result += `Table: ${tableName}\n`;
    result += `  - Enabled: ${config.enabled || 'Not set'}\n`;
    result += `  - Fields: ${config.fields || 'Not set'}\n\n`;
  });
  
  return result;
}

async function addTablePermission(
  tablePermissionsDir: string, 
  webRolesPath: string, 
  tableName: string, 
  permissionName: string, 
  webRoleName: string, 
  accessType: string, 
  privileges: string[]
): Promise<string> {
  // Ensure table-permissions directory exists
  if (!fs.existsSync(tablePermissionsDir)) {
    fs.mkdirSync(tablePermissionsDir, { recursive: true });
  }
  
  // Read web roles to get the web role ID
  const webRoles = readYamlFile(webRolesPath);
  const webRole = webRoles.find(role => role.adx_name === webRoleName);
  
  if (!webRole) {
    throw new Error(`Web role '${webRoleName}' not found. Available roles: ${webRoles.map(r => r.adx_name).join(', ')}`);
  }
  
  // Create table permission file
  const permissionFilePath = path.join(tablePermissionsDir, `${permissionName.toLowerCase().replace(/\s+/g, '-')}.yml`);
  
  const tablePermission = {
    adx_entityname: tableName,
    adx_name: permissionName,
    adx_tablename: tableName,
    adx_websiteaccesspermission: accessType,
    adx_tablepermissionid: generateGuid(),
    adx_read: privileges.includes('Read'),
    adx_write: privileges.includes('Write'),
    adx_create: privileges.includes('Create'),
    adx_delete: privileges.includes('Delete'),
    adx_append: privileges.includes('Append'),
    adx_appendto: privileges.includes('AppendTo'),
    adx_webroles: [
      {
        adx_webroleid: webRole.adx_webroleid,
        adx_name: webRole.adx_name
      }
    ]
  };
  
  writeYamlFile(permissionFilePath, [tablePermission]);
  
  return `Successfully created table permission '${permissionName}' for table '${tableName}':\n` +
         `- File: ${permissionFilePath}\n` +
         `- Web Role: ${webRoleName}\n` +
         `- Access Type: ${accessType}\n` +
         `- Privileges: ${privileges.join(', ')}\n\n` +
         `Next steps:\n1. Deploy the configuration using 'pac pages upload-code-site'`;
}

async function removeTablePermission(tablePermissionsDir: string, permissionName: string): Promise<string> {
  const permissionFileName = `${permissionName.toLowerCase().replace(/\s+/g, '-')}.yml`;
  const permissionFilePath = path.join(tablePermissionsDir, permissionFileName);
  
  if (fs.existsSync(permissionFilePath)) {
    fs.unlinkSync(permissionFilePath);
    return `Successfully removed table permission '${permissionName}'.`;
  } else {
    return `Table permission file '${permissionFileName}' not found.`;
  }
}

async function listTablePermissions(tablePermissionsDir: string): Promise<string> {
  if (!fs.existsSync(tablePermissionsDir)) {
    return 'No table permissions directory found.';
  }
  
  const files = fs.readdirSync(tablePermissionsDir).filter(f => f.endsWith('.yml'));
  
  if (files.length === 0) {
    return 'No table permissions found.';
  }
  
  let result = 'Table Permissions:\n\n';
  
  files.forEach(file => {
    const filePath = path.join(tablePermissionsDir, file);
    const permissions = readYamlFile(filePath);
    
    if (Array.isArray(permissions)) {
      permissions.forEach(permission => {
        result += `Permission: ${permission.adx_name}\n`;
        result += `  - Table: ${permission.adx_entityname}\n`;
        result += `  - Access Type: ${permission.adx_websiteaccesspermission}\n`;
        result += `  - Privileges: `;
        
        const privileges = [];
        if (permission.adx_read) privileges.push('Read');
        if (permission.adx_write) privileges.push('Write');
        if (permission.adx_create) privileges.push('Create');
        if (permission.adx_delete) privileges.push('Delete');
        if (permission.adx_append) privileges.push('Append');
        if (permission.adx_appendto) privileges.push('AppendTo');
        
        result += privileges.join(', ') + '\n';
        
        if (permission.adx_webroles && permission.adx_webroles.length > 0) {
          result += `  - Web Roles: ${permission.adx_webroles.map((r: any) => r.adx_name).join(', ')}\n`;
        }
        
        result += '\n';
      });
    }
  });
  
  return result;
}

async function checkConfigStatus(siteSettingsPath: string, tablePermissionsDir: string, tableName: string): Promise<string> {
  let result = `Configuration Status for Table: ${tableName}\n\n`;
  
  // Check WebAPI settings
  const siteSettings = readYamlFile(siteSettingsPath);
  const enabledSetting = siteSettings.find(s => s.adx_name === `Webapi/${tableName}/enabled`);
  const fieldsSetting = siteSettings.find(s => s.adx_name === `Webapi/${tableName}/fields`);
  
  result += '📋 WebAPI Configuration:\n';
  result += `  ✅ Enabled: ${enabledSetting ? enabledSetting.adx_value : '❌ Not configured'}\n`;
  result += `  ✅ Fields: ${fieldsSetting ? fieldsSetting.adx_value : '❌ Not configured'}\n\n`;
  
  // Check table permissions
  result += '🔐 Table Permissions:\n';
  
  if (!fs.existsSync(tablePermissionsDir)) {
    result += '  ❌ No table permissions directory found\n\n';
  } else {
    const files = fs.readdirSync(tablePermissionsDir).filter(f => f.endsWith('.yml'));
    const relevantPermissions: any[] = [];
    
    files.forEach(file => {
      const filePath = path.join(tablePermissionsDir, file);
      const permissions = readYamlFile(filePath);
      
      if (Array.isArray(permissions)) {
        permissions.forEach(permission => {
          if (permission.adx_entityname === tableName) {
            relevantPermissions.push(permission);
          }
        });
      }
    });
    
    if (relevantPermissions.length === 0) {
      result += '  ❌ No table permissions found for this table\n\n';
    } else {
      relevantPermissions.forEach(permission => {
        result += `  ✅ ${permission.adx_name}\n`;
        result += `     - Access: ${permission.adx_websiteaccesspermission}\n`;
        
        const privileges = [];
        if (permission.adx_read) privileges.push('Read');
        if (permission.adx_write) privileges.push('Write');
        if (permission.adx_create) privileges.push('Create');
        if (permission.adx_delete) privileges.push('Delete');
        
        result += `     - Privileges: ${privileges.join(', ')}\n`;
      });
      result += '\n';
    }
  }
  
  // Provide recommendations
  result += '💡 Recommendations:\n';
  
  if (!enabledSetting || !fieldsSetting) {
    result += '  - Add WebAPI configuration using: manage_powerpages_webapi_config with operation "add_webapi_config"\n';
  }
  
  if (!fs.existsSync(tablePermissionsDir) || !fs.readdirSync(tablePermissionsDir).some(f => {
    const permissions = readYamlFile(path.join(tablePermissionsDir, f));
    return Array.isArray(permissions) && permissions.some((p: any) => p.adx_entityname === tableName);
  })) {
    result += '  - Add table permissions using: manage_powerpages_webapi_config with operation "add_table_permission"\n';
  }
  
  result += '  - Deploy changes using: pac pages upload-code-site\n';
  
  return result;
}