const { DataverseClient } = require('../build/dataverse-client.js');
const { listRelationshipsTool } = require('../build/tools/relationship-tools.js');

// Mock MCP server
const mockServer = {
  tool: (name, schema, handler) => {
    mockServer.handlers = mockServer.handlers || {};
    mockServer.handlers[name] = handler;
  }
};

async function testRelationshipFiltering() {
  console.log('🧪 Testing relationship filtering fix...\n');

  // Create a mock client that simulates proper API filtering
  const mockClient = {
    getMetadata: async (endpoint, params) => {
      console.log(`📡 Mock API call: ${endpoint}`);
      console.log(`📋 Query params:`, JSON.stringify(params, null, 2));
      
      // All available relationships
      const allRelationships = [
        {
          SchemaName: 'test_onetomany_rel',
          RelationshipType: 0, // OneToMany
          IsCustomRelationship: true,
          IsManaged: false,
          IsValidForAdvancedFind: true,
          ReferencedEntity: 'account',
          ReferencingEntity: 'contact',
          ReferencingAttribute: 'parentcustomerid',
          IsHierarchical: false
        },
        {
          SchemaName: 'test_manytomany_rel',
          RelationshipType: 1, // ManyToMany
          IsCustomRelationship: true,
          IsManaged: false,
          IsValidForAdvancedFind: true,
          Entity1LogicalName: 'account',
          Entity2LogicalName: 'contact',
          IntersectEntityName: 'account_contact'
        }
      ];

      // Simulate API filtering based on the $filter parameter
      let filteredRelationships = allRelationships;
      
      if (params.$filter) {
        const filter = params.$filter;
        
        // Filter by relationship type
        if (filter.includes("RelationshipType eq Microsoft.Dynamics.CRM.RelationshipType'OneToManyRelationship'")) {
          filteredRelationships = filteredRelationships.filter(r => r.RelationshipType === 0);
        } else if (filter.includes("RelationshipType eq Microsoft.Dynamics.CRM.RelationshipType'ManyToManyRelationship'")) {
          filteredRelationships = filteredRelationships.filter(r => r.RelationshipType === 1);
        }
        
        // Filter by entity (this is where our fix should work)
        if (filter.includes("ReferencedEntity eq 'account'") || filter.includes("Entity1LogicalName eq 'account'")) {
          // This handles the combined filter from our fix: ((ReferencedEntity eq 'account' or ReferencingEntity eq 'account') or (Entity1LogicalName eq 'account' or Entity2LogicalName eq 'account'))
          filteredRelationships = filteredRelationships.filter(r =>
            // OneToMany conditions
            (r.ReferencedEntity === 'account' || r.ReferencingEntity === 'account') ||
            // ManyToMany conditions
            (r.Entity1LogicalName === 'account' || r.Entity2LogicalName === 'account')
          );
        }
      }
      
      return {
        value: filteredRelationships
      };
    }
  };

  // Register the tool
  listRelationshipsTool(mockServer, mockClient);

  console.log('🔍 Test 1: List all relationships (should show both OneToMany and ManyToMany)');
  const result1 = await mockServer.handlers.list_dataverse_relationships({
    relationshipType: 'All'
  });
  
  const relationships1 = JSON.parse(result1.content[0].text.split(':\n\n')[1]);
  console.log(`✅ Found ${relationships1.length} relationships:`);
  relationships1.forEach(rel => {
    console.log(`   - ${rel.schemaName}: ${rel.relationshipType}`);
  });
  console.log();

  console.log('🔍 Test 2: List only OneToMany relationships');
  const result2 = await mockServer.handlers.list_dataverse_relationships({
    relationshipType: 'OneToMany'
  });
  
  const relationships2 = JSON.parse(result2.content[0].text.split(':\n\n')[1]);
  console.log(`✅ Found ${relationships2.length} OneToMany relationships:`);
  relationships2.forEach(rel => {
    console.log(`   - ${rel.schemaName}: ${rel.relationshipType}`);
  });
  console.log();

  console.log('🔍 Test 3: List only ManyToMany relationships');
  const result3 = await mockServer.handlers.list_dataverse_relationships({
    relationshipType: 'ManyToMany'
  });
  
  const relationships3 = JSON.parse(result3.content[0].text.split(':\n\n')[1]);
  console.log(`✅ Found ${relationships3.length} ManyToMany relationships:`);
  relationships3.forEach(rel => {
    console.log(`   - ${rel.schemaName}: ${rel.relationshipType}`);
  });
  console.log();

  console.log('🔍 Test 4: List relationships for specific entity (account) - should include both types');
  const result4 = await mockServer.handlers.list_dataverse_relationships({
    relationshipType: 'All',
    entityLogicalName: 'account'
  });
  
  const relationships4 = JSON.parse(result4.content[0].text.split("for entity 'account':\n\n")[1]);
  console.log(`✅ Found ${relationships4.length} relationships for account:`);
  relationships4.forEach(rel => {
    console.log(`   - ${rel.schemaName}: ${rel.relationshipType}`);
  });
  console.log();

  // Verify the fix
  console.log('🎯 Verification:');
  console.log(`   - All relationships test: ${relationships1.length === 2 ? '✅ PASS' : '❌ FAIL'} (expected 2, got ${relationships1.length})`);
  console.log(`   - OneToMany only test: ${relationships2.length === 1 && relationships2[0].relationshipType === 'OneToMany' ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   - ManyToMany only test: ${relationships3.length === 1 && relationships3[0].relationshipType === 'ManyToMany' ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   - Entity filtering test: ${relationships4.length === 2 ? '✅ PASS' : '❌ FAIL'} (expected 2, got ${relationships4.length})`);

  const allTestsPassed = 
    relationships1.length === 2 &&
    relationships2.length === 1 && relationships2[0].relationshipType === 'OneToMany' &&
    relationships3.length === 1 && relationships3[0].relationshipType === 'ManyToMany' &&
    relationships4.length === 2;

  console.log(`\n🏁 Overall result: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (allTestsPassed) {
    console.log('🎉 The relationship filtering bug has been successfully fixed!');
    console.log('   - OneToMany relationships are correctly identified');
    console.log('   - ManyToMany relationships are correctly identified');
    console.log('   - Entity filtering works for both relationship types');
  }
}

// Run the test
testRelationshipFiltering().catch(console.error);