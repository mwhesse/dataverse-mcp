import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DataverseClient } from "../dataverse-client.js";

export function createBusinessUnitTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "create_dataverse_businessunit",
    {
      name: z.string().min(1).max(160).describe("Name of the business unit"),
      parentBusinessUnitId: z.string().optional().describe("Unique identifier for the parent business unit"),
      description: z.string().max(2000).optional().describe("Description of the business unit"),
      divisionName: z.string().max(100).optional().describe("Name of the division to which the business unit belongs"),
      emailAddress: z.string().email().max(100).optional().describe("Email address for the business unit"),
      costCenter: z.string().max(100).optional().describe("Name of the business unit cost center"),
      creditLimit: z.number().min(0).max(1000000000).optional().describe("Credit limit for the business unit"),
      fileAsName: z.string().max(100).optional().describe("Alternative name under which the business unit can be filed"),
      ftpSiteUrl: z.string().url().max(200).optional().describe("FTP site URL for the business unit"),
      webSiteUrl: z.string().url().max(200).optional().describe("Website URL for the business unit"),
      stockExchange: z.string().max(10).optional().describe("Stock exchange on which the business is listed"),
      tickerSymbol: z.string().max(10).optional().describe("Stock exchange ticker symbol for the business unit"),
      isDisabled: z.boolean().optional().default(false).describe("Whether the business unit is disabled"),
      // Address 1 fields
      address1_name: z.string().max(100).optional().describe("Name for address 1"),
      address1_line1: z.string().max(250).optional().describe("First line for address 1"),
      address1_line2: z.string().max(250).optional().describe("Second line for address 1"),
      address1_line3: z.string().max(250).optional().describe("Third line for address 1"),
      address1_city: z.string().max(80).optional().describe("City name for address 1"),
      address1_stateorprovince: z.string().max(50).optional().describe("State or province for address 1"),
      address1_postalcode: z.string().max(20).optional().describe("ZIP Code or postal code for address 1"),
      address1_country: z.string().max(80).optional().describe("Country/region name for address 1"),
      address1_county: z.string().max(50).optional().describe("County name for address 1"),
      address1_telephone1: z.string().max(50).optional().describe("Main phone number for address 1"),
      address1_telephone2: z.string().max(50).optional().describe("Other phone number for address 1"),
      address1_telephone3: z.string().max(50).optional().describe("Third telephone number for address 1"),
      address1_fax: z.string().max(50).optional().describe("Fax number for address 1"),
      address1_latitude: z.number().min(-90).max(90).optional().describe("Latitude for address 1"),
      address1_longitude: z.number().min(-180).max(180).optional().describe("Longitude for address 1"),
      address1_postofficebox: z.string().max(20).optional().describe("Post office box number for address 1"),
      address1_upszone: z.string().max(4).optional().describe("UPS zone for address 1"),
      address1_utcoffset: z.number().min(-1500).max(1500).optional().describe("UTC offset for address 1"),
      // Address 2 fields
      address2_name: z.string().max(100).optional().describe("Name for address 2"),
      address2_line1: z.string().max(250).optional().describe("First line for address 2"),
      address2_line2: z.string().max(250).optional().describe("Second line for address 2"),
      address2_line3: z.string().max(250).optional().describe("Third line for address 2"),
      address2_city: z.string().max(80).optional().describe("City name for address 2"),
      address2_stateorprovince: z.string().max(50).optional().describe("State or province for address 2"),
      address2_postalcode: z.string().max(20).optional().describe("ZIP Code or postal code for address 2"),
      address2_country: z.string().max(80).optional().describe("Country/region name for address 2"),
      address2_county: z.string().max(50).optional().describe("County name for address 2"),
      address2_telephone1: z.string().max(50).optional().describe("First telephone number for address 2"),
      address2_telephone2: z.string().max(50).optional().describe("Second telephone number for address 2"),
      address2_telephone3: z.string().max(50).optional().describe("Third telephone number for address 2"),
      address2_fax: z.string().max(50).optional().describe("Fax number for address 2"),
      address2_latitude: z.number().min(-90).max(90).optional().describe("Latitude for address 2"),
      address2_longitude: z.number().min(-180).max(180).optional().describe("Longitude for address 2"),
      address2_postofficebox: z.string().max(20).optional().describe("Post office box number for address 2"),
      address2_upszone: z.string().max(4).optional().describe("UPS zone for address 2"),
      address2_utcoffset: z.number().min(-1500).max(1500).optional().describe("UTC offset for address 2")
    },
    async (params) => {
      try {
        const businessUnitData: any = {
          name: params.name,
          isdisabled: params.isDisabled || false
        };

        // Add optional fields if provided
        if (params.parentBusinessUnitId) {
          businessUnitData['parentbusinessunitid@odata.bind'] = `/businessunits(${params.parentBusinessUnitId})`;
        }
        if (params.description) businessUnitData.description = params.description;
        if (params.divisionName) businessUnitData.divisionname = params.divisionName;
        if (params.emailAddress) businessUnitData.emailaddress = params.emailAddress;
        if (params.costCenter) businessUnitData.costcenter = params.costCenter;
        if (params.creditLimit !== undefined) businessUnitData.creditlimit = params.creditLimit;
        if (params.fileAsName) businessUnitData.fileasname = params.fileAsName;
        if (params.ftpSiteUrl) businessUnitData.ftpsiteurl = params.ftpSiteUrl;
        if (params.webSiteUrl) businessUnitData.websiteurl = params.webSiteUrl;
        if (params.stockExchange) businessUnitData.stockexchange = params.stockExchange;
        if (params.tickerSymbol) businessUnitData.tickersymbol = params.tickerSymbol;

        // Add address 1 fields
        if (params.address1_name) businessUnitData.address1_name = params.address1_name;
        if (params.address1_line1) businessUnitData.address1_line1 = params.address1_line1;
        if (params.address1_line2) businessUnitData.address1_line2 = params.address1_line2;
        if (params.address1_line3) businessUnitData.address1_line3 = params.address1_line3;
        if (params.address1_city) businessUnitData.address1_city = params.address1_city;
        if (params.address1_stateorprovince) businessUnitData.address1_stateorprovince = params.address1_stateorprovince;
        if (params.address1_postalcode) businessUnitData.address1_postalcode = params.address1_postalcode;
        if (params.address1_country) businessUnitData.address1_country = params.address1_country;
        if (params.address1_county) businessUnitData.address1_county = params.address1_county;
        if (params.address1_telephone1) businessUnitData.address1_telephone1 = params.address1_telephone1;
        if (params.address1_telephone2) businessUnitData.address1_telephone2 = params.address1_telephone2;
        if (params.address1_telephone3) businessUnitData.address1_telephone3 = params.address1_telephone3;
        if (params.address1_fax) businessUnitData.address1_fax = params.address1_fax;
        if (params.address1_latitude !== undefined) businessUnitData.address1_latitude = params.address1_latitude;
        if (params.address1_longitude !== undefined) businessUnitData.address1_longitude = params.address1_longitude;
        if (params.address1_postofficebox) businessUnitData.address1_postofficebox = params.address1_postofficebox;
        if (params.address1_upszone) businessUnitData.address1_upszone = params.address1_upszone;
        if (params.address1_utcoffset !== undefined) businessUnitData.address1_utcoffset = params.address1_utcoffset;

        // Add address 2 fields
        if (params.address2_name) businessUnitData.address2_name = params.address2_name;
        if (params.address2_line1) businessUnitData.address2_line1 = params.address2_line1;
        if (params.address2_line2) businessUnitData.address2_line2 = params.address2_line2;
        if (params.address2_line3) businessUnitData.address2_line3 = params.address2_line3;
        if (params.address2_city) businessUnitData.address2_city = params.address2_city;
        if (params.address2_stateorprovince) businessUnitData.address2_stateorprovince = params.address2_stateorprovince;
        if (params.address2_postalcode) businessUnitData.address2_postalcode = params.address2_postalcode;
        if (params.address2_country) businessUnitData.address2_country = params.address2_country;
        if (params.address2_county) businessUnitData.address2_county = params.address2_county;
        if (params.address2_telephone1) businessUnitData.address2_telephone1 = params.address2_telephone1;
        if (params.address2_telephone2) businessUnitData.address2_telephone2 = params.address2_telephone2;
        if (params.address2_telephone3) businessUnitData.address2_telephone3 = params.address2_telephone3;
        if (params.address2_fax) businessUnitData.address2_fax = params.address2_fax;
        if (params.address2_latitude !== undefined) businessUnitData.address2_latitude = params.address2_latitude;
        if (params.address2_longitude !== undefined) businessUnitData.address2_longitude = params.address2_longitude;
        if (params.address2_postofficebox) businessUnitData.address2_postofficebox = params.address2_postofficebox;
        if (params.address2_upszone) businessUnitData.address2_upszone = params.address2_upszone;
        if (params.address2_utcoffset !== undefined) businessUnitData.address2_utcoffset = params.address2_utcoffset;

        const response = await client.post('businessunits', businessUnitData);
        
        return {
          content: [
            {
              type: "text",
              text: `Successfully created business unit '${params.name}'.\n\nBusiness unit ID: ${response.businessunitid}\n\nResponse: ${JSON.stringify(response, null, 2)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error creating business unit: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function getBusinessUnitTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "get_dataverse_businessunit",
    {
      businessUnitId: z.string().describe("Unique identifier of the business unit to retrieve")
    },
    async (params) => {
      try {
        const selectFields = [
          'businessunitid', 'name', 'description', 'divisionname', 'emailaddress',
          'costcenter', 'creditlimit', 'fileasname', 'ftpsiteurl', 'websiteurl',
          'stockexchange', 'tickersymbol', 'isdisabled', 'createdon', 'modifiedon',
          'createdby', 'modifiedby', 'parentbusinessunitid', 'organizationid',
          'address1_name', 'address1_line1', 'address1_line2', 'address1_line3',
          'address1_city', 'address1_stateorprovince', 'address1_postalcode',
          'address1_country', 'address1_county', 'address1_telephone1',
          'address1_telephone2', 'address1_telephone3', 'address1_fax',
          'address1_latitude', 'address1_longitude', 'address1_postofficebox',
          'address1_upszone', 'address1_utcoffset',
          'address2_name', 'address2_line1', 'address2_line2', 'address2_line3',
          'address2_city', 'address2_stateorprovince', 'address2_postalcode',
          'address2_country', 'address2_county', 'address2_telephone1',
          'address2_telephone2', 'address2_telephone3', 'address2_fax',
          'address2_latitude', 'address2_longitude', 'address2_postofficebox',
          'address2_upszone', 'address2_utcoffset'
        ].join(',');

        const expandFields = [
          'parentbusinessunitid($select=businessunitid,name)',
          'createdby($select=systemuserid,fullname)',
          'modifiedby($select=systemuserid,fullname)'
        ].join(',');

        const businessUnit = await client.get(`businessunits(${params.businessUnitId})?$select=${selectFields}&$expand=${expandFields}`);

        return {
          content: [
            {
              type: "text",
              text: `Business unit information:\n\n${JSON.stringify(businessUnit, null, 2)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error retrieving business unit: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function updateBusinessUnitTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "update_dataverse_businessunit",
    {
      businessUnitId: z.string().describe("Unique identifier of the business unit to update"),
      name: z.string().min(1).max(160).optional().describe("Name of the business unit"),
      description: z.string().max(2000).optional().describe("Description of the business unit"),
      divisionName: z.string().max(100).optional().describe("Name of the division to which the business unit belongs"),
      emailAddress: z.string().email().max(100).optional().describe("Email address for the business unit"),
      costCenter: z.string().max(100).optional().describe("Name of the business unit cost center"),
      creditLimit: z.number().min(0).max(1000000000).optional().describe("Credit limit for the business unit"),
      fileAsName: z.string().max(100).optional().describe("Alternative name under which the business unit can be filed"),
      ftpSiteUrl: z.string().url().max(200).optional().describe("FTP site URL for the business unit"),
      webSiteUrl: z.string().url().max(200).optional().describe("Website URL for the business unit"),
      stockExchange: z.string().max(10).optional().describe("Stock exchange on which the business is listed"),
      tickerSymbol: z.string().max(10).optional().describe("Stock exchange ticker symbol for the business unit"),
      isDisabled: z.boolean().optional().describe("Whether the business unit is disabled"),
      // Address 1 fields
      address1_name: z.string().max(100).optional().describe("Name for address 1"),
      address1_line1: z.string().max(250).optional().describe("First line for address 1"),
      address1_line2: z.string().max(250).optional().describe("Second line for address 1"),
      address1_line3: z.string().max(250).optional().describe("Third line for address 1"),
      address1_city: z.string().max(80).optional().describe("City name for address 1"),
      address1_stateorprovince: z.string().max(50).optional().describe("State or province for address 1"),
      address1_postalcode: z.string().max(20).optional().describe("ZIP Code or postal code for address 1"),
      address1_country: z.string().max(80).optional().describe("Country/region name for address 1"),
      address1_county: z.string().max(50).optional().describe("County name for address 1"),
      address1_telephone1: z.string().max(50).optional().describe("Main phone number for address 1"),
      address1_telephone2: z.string().max(50).optional().describe("Other phone number for address 1"),
      address1_telephone3: z.string().max(50).optional().describe("Third telephone number for address 1"),
      address1_fax: z.string().max(50).optional().describe("Fax number for address 1"),
      address1_latitude: z.number().min(-90).max(90).optional().describe("Latitude for address 1"),
      address1_longitude: z.number().min(-180).max(180).optional().describe("Longitude for address 1"),
      address1_postofficebox: z.string().max(20).optional().describe("Post office box number for address 1"),
      address1_upszone: z.string().max(4).optional().describe("UPS zone for address 1"),
      address1_utcoffset: z.number().min(-1500).max(1500).optional().describe("UTC offset for address 1"),
      // Address 2 fields
      address2_name: z.string().max(100).optional().describe("Name for address 2"),
      address2_line1: z.string().max(250).optional().describe("First line for address 2"),
      address2_line2: z.string().max(250).optional().describe("Second line for address 2"),
      address2_line3: z.string().max(250).optional().describe("Third line for address 2"),
      address2_city: z.string().max(80).optional().describe("City name for address 2"),
      address2_stateorprovince: z.string().max(50).optional().describe("State or province for address 2"),
      address2_postalcode: z.string().max(20).optional().describe("ZIP Code or postal code for address 2"),
      address2_country: z.string().max(80).optional().describe("Country/region name for address 2"),
      address2_county: z.string().max(50).optional().describe("County name for address 2"),
      address2_telephone1: z.string().max(50).optional().describe("First telephone number for address 2"),
      address2_telephone2: z.string().max(50).optional().describe("Second telephone number for address 2"),
      address2_telephone3: z.string().max(50).optional().describe("Third telephone number for address 2"),
      address2_fax: z.string().max(50).optional().describe("Fax number for address 2"),
      address2_latitude: z.number().min(-90).max(90).optional().describe("Latitude for address 2"),
      address2_longitude: z.number().min(-180).max(180).optional().describe("Longitude for address 2"),
      address2_postofficebox: z.string().max(20).optional().describe("Post office box number for address 2"),
      address2_upszone: z.string().max(4).optional().describe("UPS zone for address 2"),
      address2_utcoffset: z.number().min(-1500).max(1500).optional().describe("UTC offset for address 2")
    },
    async (params) => {
      try {
        const updateData: any = {};

        // Add fields to update if provided
        if (params.name) updateData.name = params.name;
        if (params.description !== undefined) updateData.description = params.description;
        if (params.divisionName !== undefined) updateData.divisionname = params.divisionName;
        if (params.emailAddress !== undefined) updateData.emailaddress = params.emailAddress;
        if (params.costCenter !== undefined) updateData.costcenter = params.costCenter;
        if (params.creditLimit !== undefined) updateData.creditlimit = params.creditLimit;
        if (params.fileAsName !== undefined) updateData.fileasname = params.fileAsName;
        if (params.ftpSiteUrl !== undefined) updateData.ftpsiteurl = params.ftpSiteUrl;
        if (params.webSiteUrl !== undefined) updateData.websiteurl = params.webSiteUrl;
        if (params.stockExchange !== undefined) updateData.stockexchange = params.stockExchange;
        if (params.tickerSymbol !== undefined) updateData.tickersymbol = params.tickerSymbol;
        if (params.isDisabled !== undefined) updateData.isdisabled = params.isDisabled;

        // Add address 1 fields
        if (params.address1_name !== undefined) updateData.address1_name = params.address1_name;
        if (params.address1_line1 !== undefined) updateData.address1_line1 = params.address1_line1;
        if (params.address1_line2 !== undefined) updateData.address1_line2 = params.address1_line2;
        if (params.address1_line3 !== undefined) updateData.address1_line3 = params.address1_line3;
        if (params.address1_city !== undefined) updateData.address1_city = params.address1_city;
        if (params.address1_stateorprovince !== undefined) updateData.address1_stateorprovince = params.address1_stateorprovince;
        if (params.address1_postalcode !== undefined) updateData.address1_postalcode = params.address1_postalcode;
        if (params.address1_country !== undefined) updateData.address1_country = params.address1_country;
        if (params.address1_county !== undefined) updateData.address1_county = params.address1_county;
        if (params.address1_telephone1 !== undefined) updateData.address1_telephone1 = params.address1_telephone1;
        if (params.address1_telephone2 !== undefined) updateData.address1_telephone2 = params.address1_telephone2;
        if (params.address1_telephone3 !== undefined) updateData.address1_telephone3 = params.address1_telephone3;
        if (params.address1_fax !== undefined) updateData.address1_fax = params.address1_fax;
        if (params.address1_latitude !== undefined) updateData.address1_latitude = params.address1_latitude;
        if (params.address1_longitude !== undefined) updateData.address1_longitude = params.address1_longitude;
        if (params.address1_postofficebox !== undefined) updateData.address1_postofficebox = params.address1_postofficebox;
        if (params.address1_upszone !== undefined) updateData.address1_upszone = params.address1_upszone;
        if (params.address1_utcoffset !== undefined) updateData.address1_utcoffset = params.address1_utcoffset;

        // Add address 2 fields
        if (params.address2_name !== undefined) updateData.address2_name = params.address2_name;
        if (params.address2_line1 !== undefined) updateData.address2_line1 = params.address2_line1;
        if (params.address2_line2 !== undefined) updateData.address2_line2 = params.address2_line2;
        if (params.address2_line3 !== undefined) updateData.address2_line3 = params.address2_line3;
        if (params.address2_city !== undefined) updateData.address2_city = params.address2_city;
        if (params.address2_stateorprovince !== undefined) updateData.address2_stateorprovince = params.address2_stateorprovince;
        if (params.address2_postalcode !== undefined) updateData.address2_postalcode = params.address2_postalcode;
        if (params.address2_country !== undefined) updateData.address2_country = params.address2_country;
        if (params.address2_county !== undefined) updateData.address2_county = params.address2_county;
        if (params.address2_telephone1 !== undefined) updateData.address2_telephone1 = params.address2_telephone1;
        if (params.address2_telephone2 !== undefined) updateData.address2_telephone2 = params.address2_telephone2;
        if (params.address2_telephone3 !== undefined) updateData.address2_telephone3 = params.address2_telephone3;
        if (params.address2_fax !== undefined) updateData.address2_fax = params.address2_fax;
        if (params.address2_latitude !== undefined) updateData.address2_latitude = params.address2_latitude;
        if (params.address2_longitude !== undefined) updateData.address2_longitude = params.address2_longitude;
        if (params.address2_postofficebox !== undefined) updateData.address2_postofficebox = params.address2_postofficebox;
        if (params.address2_upszone !== undefined) updateData.address2_upszone = params.address2_upszone;
        if (params.address2_utcoffset !== undefined) updateData.address2_utcoffset = params.address2_utcoffset;

        if (Object.keys(updateData).length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No fields provided to update"
              }
            ],
            isError: true
          };
        }

        await client.patch(`businessunits(${params.businessUnitId})`, updateData);

        return {
          content: [
            {
              type: "text",
              text: `Successfully updated business unit. Updated fields: ${Object.keys(updateData).join(', ')}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error updating business unit: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function deleteBusinessUnitTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "delete_dataverse_businessunit",
    {
      businessUnitId: z.string().describe("Unique identifier of the business unit to delete")
    },
    async (params) => {
      try {
        await client.delete(`businessunits(${params.businessUnitId})`);

        return {
          content: [
            {
              type: "text",
              text: "Successfully deleted business unit"
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error deleting business unit: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function listBusinessUnitsTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "list_dataverse_businessunits",
    {
      top: z.number().min(1).max(5000).optional().describe("Maximum number of business units to return (default: 50)"),
      filter: z.string().optional().describe("OData filter expression"),
      orderby: z.string().optional().describe("OData orderby expression"),
      select: z.string().optional().describe("OData select expression to specify which fields to return")
    },
    async (params) => {
      try {
        let query = 'businessunits?';
        const queryParams: string[] = [];

        // Select fields
        const selectFields = params.select || [
          'businessunitid', 'name', 'description', 'divisionname', 'emailaddress',
          'costcenter', 'isdisabled', 'createdon', 'modifiedon', 'parentbusinessunitid'
        ].join(',');
        queryParams.push(`$select=${selectFields}`);

        // Top
        queryParams.push(`$top=${params.top || 50}`);

        // Filter
        if (params.filter) {
          queryParams.push(`$filter=${encodeURIComponent(params.filter)}`);
        }

        // Order by
        if (params.orderby) {
          queryParams.push(`$orderby=${encodeURIComponent(params.orderby)}`);
        }

        // Expand parent business unit
        queryParams.push('$expand=parentbusinessunitid($select=businessunitid,name)');

        // Add count
        queryParams.push('$count=true');

        query += queryParams.join('&');
        const result = await client.get(query);

        const businessUnits = result.value?.map((bu: any) => ({
          businessUnitId: bu.businessunitid,
          name: bu.name,
          description: bu.description,
          divisionName: bu.divisionname,
          emailAddress: bu.emailaddress,
          costCenter: bu.costcenter,
          isDisabled: bu.isdisabled,
          createdOn: bu.createdon,
          modifiedOn: bu.modifiedon,
          parentBusinessUnitId: bu.parentbusinessunitid,
          parentBusinessUnitName: bu.parentbusinessunitid?.name
        })) || [];

        return {
          content: [
            {
              type: "text",
              text: `Found ${businessUnits.length} business units (Total: ${result['@odata.count'] || businessUnits.length}):\n\n${JSON.stringify(businessUnits, null, 2)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error listing business units: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function getBusinessUnitHierarchyTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "get_businessunit_hierarchy",
    {
      businessUnitId: z.string().describe("Unique identifier of the business unit to get hierarchy for")
    },
    async (params) => {
      try {
        // Use the RetrieveBusinessHierarchyBusinessUnit bound function
        const response = await client.get(`businessunits(${params.businessUnitId})/Microsoft.Dynamics.CRM.RetrieveBusinessHierarchyBusinessUnit()`);

        return {
          content: [
            {
              type: "text",
              text: `Business unit hierarchy:\n\n${JSON.stringify(response, null, 2)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error retrieving business unit hierarchy: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function setBusinessUnitParentTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "set_businessunit_parent",
    {
      businessUnitId: z.string().describe("Unique identifier of the business unit"),
      parentBusinessUnitId: z.string().describe("Unique identifier of the new parent business unit")
    },
    async (params) => {
      try {
        // Use the SetParentBusinessUnit action
        await client.callAction('SetParentBusinessUnit', {
          BusinessUnitId: params.businessUnitId,
          ParentId: params.parentBusinessUnitId
        });

        return {
          content: [
            {
              type: "text",
              text: "Successfully set business unit parent"
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error setting business unit parent: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function getBusinessUnitUsersTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "get_businessunit_users",
    {
      businessUnitId: z.string().describe("Unique identifier of the business unit"),
      includeSubsidiaryUsers: z.boolean().optional().default(false).describe("Whether to include users from subsidiary business units")
    },
    async (params) => {
      try {
        let endpoint: string;
        
        if (params.includeSubsidiaryUsers) {
          // Use the RetrieveSubsidiaryUsersBusinessUnit function
          endpoint = `RetrieveSubsidiaryUsersBusinessUnit(BusinessUnitId=${params.businessUnitId})`;
        } else {
          // Get users directly associated with the business unit
          endpoint = `systemusers?$filter=businessunitid/businessunitid eq ${params.businessUnitId}&$select=systemuserid,fullname,domainname,businessunitid,isdisabled&$expand=businessunitid($select=name)`;
        }

        const result = await client.get(endpoint);
        const users = params.includeSubsidiaryUsers ? result : result.value;

        const formattedUsers = (Array.isArray(users) ? users : users?.value || []).map((user: any) => ({
          userId: user.systemuserid,
          fullName: user.fullname,
          domainName: user.domainname,
          businessUnitId: user.businessunitid,
          businessUnitName: user.businessunitid?.name,
          isDisabled: user.isdisabled
        }));

        return {
          content: [
            {
              type: "text",
              text: `Found ${formattedUsers.length} ${params.includeSubsidiaryUsers ? 'subsidiary ' : ''}users for business unit:\n\n${JSON.stringify(formattedUsers, null, 2)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error retrieving business unit users: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export function getBusinessUnitTeamsTool(server: McpServer, client: DataverseClient) {
  server.tool(
    "get_businessunit_teams",
    {
      businessUnitId: z.string().describe("Unique identifier of the business unit"),
      includeSubsidiaryTeams: z.boolean().optional().default(false).describe("Whether to include teams from subsidiary business units")
    },
    async (params) => {
      try {
        let endpoint: string;
        
        if (params.includeSubsidiaryTeams) {
          // Use the RetrieveSubsidiaryTeamsBusinessUnit function
          endpoint = `RetrieveSubsidiaryTeamsBusinessUnit(BusinessUnitId=${params.businessUnitId})`;
        } else {
          // Get teams directly associated with the business unit
          endpoint = `teams?$filter=businessunitid/businessunitid eq ${params.businessUnitId}&$select=teamid,name,teamtype,businessunitid&$expand=businessunitid($select=name)`;
        }

        const result = await client.get(endpoint);
        const teams = params.includeSubsidiaryTeams ? result : result.value;

        const formattedTeams = (Array.isArray(teams) ? teams : teams?.value || []).map((team: any) => ({
          teamId: team.teamid,
          name: team.name,
          teamType: team.teamtype,
          teamTypeLabel: getTeamTypeLabel(team.teamtype),
          businessUnitId: team.businessunitid,
          businessUnitName: team.businessunitid?.name
        }));

        return {
          content: [
            {
              type: "text",
              text: `Found ${formattedTeams.length} ${params.includeSubsidiaryTeams ? 'subsidiary ' : ''}teams for business unit:\n\n${JSON.stringify(formattedTeams, null, 2)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error retrieving business unit teams: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

// Helper function
function getTeamTypeLabel(teamType: number): string {
  switch (teamType) {
    case 0: return 'Owner';
    case 1: return 'Access';
    case 2: return 'Security Group';
    case 3: return 'Office Group';
    default: return 'Unknown';
  }
}