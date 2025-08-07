const fs = require('fs');

// Test the enhanced schema export functionality
async function testEnhancedSchemaExport() {
  console.log('🧪 Testing enhanced schema export functionality...');
  
  try {
    // Import the function from the built module
    const { exportSolutionSchema } = await import('../build/tools/schema-tools.js');
    
    // Mock client with basic functionality
    const mockClient = {
      getSolutionContext: () => ({
        solutionUniqueName: 'TestSolution',
        solutionDisplayName: 'Test Solution',
        customizationPrefix: 'test'
      }),
      getMetadata: async (url) => {
        console.log(`Mock API call: ${url}`);
        
        if (url.includes('GlobalOptionSetDefinitions')) {
          if (url.includes('test-guid-1') || url.includes("Name eq 'test_priority'")) {
            return {
              Name: 'test_priority',
              IsCustomOptionSet: true,
              IsManaged: false,
              MetadataId: 'test-guid-1',
              DisplayName: { UserLocalizedLabel: { Label: 'Test Priority' } },
              Options: [
                { Value: 1, Label: { UserLocalizedLabel: { Label: 'Low' } } },
                { Value: 2, Label: { UserLocalizedLabel: { Label: 'High' } } }
              ]
            };
          } else if (url.includes('test-guid-2') || url.includes("Name eq 'xyz_status'")) {
            return {
              Name: 'xyz_status',
              IsCustomOptionSet: true,
              IsManaged: false,
              MetadataId: 'test-guid-2',
              DisplayName: { UserLocalizedLabel: { Label: 'XYZ Status' } },
              Options: [
                { Value: 1, Label: { UserLocalizedLabel: { Label: 'Active' } } },
                { Value: 2, Label: { UserLocalizedLabel: { Label: 'Inactive' } } }
              ]
            };
          } else if (url.includes("Name eq 'xyz_status'")) {
            return {
              value: [{
                Name: 'xyz_status',
                IsCustomOptionSet: true,
                IsManaged: false,
                MetadataId: 'test-guid-2',
                DisplayName: { UserLocalizedLabel: { Label: 'XYZ Status' } },
                Options: [
                  { Value: 1, Label: { UserLocalizedLabel: { Label: 'Active' } } },
                  { Value: 2, Label: { UserLocalizedLabel: { Label: 'Inactive' } } }
                ]
              }]
            };
          } else {
            return {
              value: [
                {
                  Name: 'test_priority',
                  IsCustomOptionSet: true,
                  IsManaged: false,
                  MetadataId: 'test-guid-1',
                  DisplayName: { UserLocalizedLabel: { Label: 'Test Priority' } },
                  Options: [
                    { Value: 1, Label: { UserLocalizedLabel: { Label: 'Low' } } },
                    { Value: 2, Label: { UserLocalizedLabel: { Label: 'High' } } }
                  ]
                },
                {
                  Name: 'xyz_status',
                  IsCustomOptionSet: true,
                  IsManaged: false,
                  MetadataId: 'test-guid-2',
                  DisplayName: { UserLocalizedLabel: { Label: 'XYZ Status' } },
                  Options: [
                    { Value: 1, Label: { UserLocalizedLabel: { Label: 'Active' } } },
                    { Value: 2, Label: { UserLocalizedLabel: { Label: 'Inactive' } } }
                  ]
                },
                {
                  Name: 'system_optionset',
                  IsCustomOptionSet: false,
                  IsManaged: true,
                  MetadataId: 'test-guid-3'
                }
              ]
            };
          }
        }
        
        if (url.includes('EntityDefinitions')) {
          return {
            value: [
              {
                LogicalName: 'test_customer',
                DisplayName: { UserLocalizedLabel: { Label: 'Test Customer' } },
                DisplayCollectionName: { UserLocalizedLabel: { Label: 'Test Customers' } },
                SchemaName: 'test_Customer',
                IsCustomEntity: true,
                IsManaged: false,
                OwnershipType: 1,
                HasActivities: true,
                HasNotes: true,
                IsAuditEnabled: true,
                IsDuplicateDetectionEnabled: false,
                IsValidForQueue: false,
                IsConnectionsEnabled: false,
                IsMailMergeEnabled: false,
                IsDocumentManagementEnabled: false,
                PrimaryNameAttribute: 'test_name',
                PrimaryIdAttribute: 'test_customerid'
              },
              {
                LogicalName: 'xyz_product',
                DisplayName: { UserLocalizedLabel: { Label: 'XYZ Product' } },
                DisplayCollectionName: { UserLocalizedLabel: { Label: 'XYZ Products' } },
                SchemaName: 'xyz_Product',
                IsCustomEntity: true,
                IsManaged: false,
                OwnershipType: 1,
                HasActivities: false,
                HasNotes: false,
                IsAuditEnabled: true,
                IsDuplicateDetectionEnabled: false,
                IsValidForQueue: false,
                IsConnectionsEnabled: false,
                IsMailMergeEnabled: false,
                IsDocumentManagementEnabled: false,
                PrimaryNameAttribute: 'xyz_name',
                PrimaryIdAttribute: 'xyz_productid'
              },
              {
                LogicalName: 'contact',
                DisplayName: { UserLocalizedLabel: { Label: 'Contact' } },
                DisplayCollectionName: { UserLocalizedLabel: { Label: 'Contacts' } },
                SchemaName: 'Contact',
                IsCustomEntity: false,
                IsManaged: true,
                OwnershipType: 1,
                HasActivities: true,
                HasNotes: true,
                IsAuditEnabled: true,
                IsDuplicateDetectionEnabled: true,
                IsValidForQueue: true,
                IsConnectionsEnabled: true,
                IsMailMergeEnabled: true,
                IsDocumentManagementEnabled: true,
                PrimaryNameAttribute: 'fullname',
                PrimaryIdAttribute: 'contactid'
              },
              {
                LogicalName: 'account',
                DisplayName: { UserLocalizedLabel: { Label: 'Account' } },
                DisplayCollectionName: { UserLocalizedLabel: { Label: 'Accounts' } },
                SchemaName: 'Account',
                IsCustomEntity: false,
                IsManaged: true,
                OwnershipType: 1,
                HasActivities: true,
                HasNotes: true,
                IsAuditEnabled: true,
                IsDuplicateDetectionEnabled: true,
                IsValidForQueue: true,
                IsConnectionsEnabled: true,
                IsMailMergeEnabled: true,
                IsDocumentManagementEnabled: true,
                PrimaryNameAttribute: 'name',
                PrimaryIdAttribute: 'accountid'
              },
              {
                LogicalName: 'other_customtable',
                DisplayName: { UserLocalizedLabel: { Label: 'Other Custom Table' } },
                DisplayCollectionName: { UserLocalizedLabel: { Label: 'Other Custom Tables' } },
                SchemaName: 'other_CustomTable',
                IsCustomEntity: true,
                IsManaged: false,
                OwnershipType: 1,
                HasActivities: false,
                HasNotes: false,
                IsAuditEnabled: false,
                IsDuplicateDetectionEnabled: false,
                IsValidForQueue: false,
                IsConnectionsEnabled: false,
                IsMailMergeEnabled: false,
                IsDocumentManagementEnabled: false,
                PrimaryNameAttribute: 'other_name',
                PrimaryIdAttribute: 'other_customtableid'
              }
            ]
          };
        }
        
        if (url.includes('/Attributes')) {
          return {
            value: [
              {
                LogicalName: 'test_name',
                DisplayName: { UserLocalizedLabel: { Label: 'Name' } },
                SchemaName: 'test_Name',
                AttributeType: 'String',
                RequiredLevel: { Value: 'ApplicationRequired' },
                IsAuditEnabled: true,
                IsValidForAdvancedFind: true,
                IsValidForCreate: true,
                IsValidForUpdate: true,
                IsCustomAttribute: true,
                IsManaged: false,
                IsPrimaryId: false,
                IsPrimaryName: true
              }
            ]
          };
        }
        
        return { value: [] };
      }
    };
    
    // Test 1: Multiple customization prefixes
    console.log('\n📋 Test 1: Multiple customization prefixes');
    const args1 = {
      outputPath: 'test-multi-prefix-schema.json',
      includeAllSystemTables: false,
      includeSystemColumns: false,
      includeSystemOptionSets: false,
      customizationPrefixes: ['test', 'xyz'],
      systemTablesToInclude: ['contact', 'account'],
      prettify: true
    };
    
    const result1 = await exportSolutionSchema(mockClient, args1);
    console.log('✅ Multi-prefix export completed');
    
    // Verify the output
    if (fs.existsSync('test-multi-prefix-schema.json')) {
      const schema1 = JSON.parse(fs.readFileSync('test-multi-prefix-schema.json', 'utf8'));
      
      const checks1 = [
        { name: 'Contains test_customer', check: schema1.tables.some(t => t.logicalName === 'test_customer') },
        { name: 'Contains xyz_product', check: schema1.tables.some(t => t.logicalName === 'xyz_product') },
        { name: 'Excludes other_customtable', check: !schema1.tables.some(t => t.logicalName === 'other_customtable') },
        { name: 'Contains test_priority option set', check: schema1.globalOptionSets.some(o => o.name === 'test_priority') },
        { name: 'Contains xyz_status option set', check: schema1.globalOptionSets.some(o => o.name === 'xyz_status') },
        { name: 'Excludes system option set', check: !schema1.globalOptionSets.some(o => o.name === 'system_optionset') },
        { name: 'Metadata includes customizationPrefixes', check: Array.isArray(schema1.metadata.customizationPrefixes) && schema1.metadata.customizationPrefixes.includes('test') && schema1.metadata.customizationPrefixes.includes('xyz') }
      ];
      
      let allPassed1 = true;
      for (const check of checks1) {
        if (check.check) {
          console.log(`  ✅ ${check.name}: PASS`);
        } else {
          console.log(`  ❌ ${check.name}: FAIL`);
          allPassed1 = false;
        }
      }
      
      if (!allPassed1) {
        throw new Error('Test 1 failed some checks');
      }
    } else {
      throw new Error('Test 1 output file not created');
    }
    
    // Test 2: System tables with filtering
    console.log('\n📋 Test 2: System tables with filtering');
    const args2 = {
      outputPath: 'test-system-tables-schema.json',
      includeAllSystemTables: false,
      includeSystemColumns: false,
      includeSystemOptionSets: false,
      customizationPrefixes: ['test'],
      systemTablesToInclude: ['contact'],  // Only contact, not account
      prettify: true
    };
    
    const result2 = await exportSolutionSchema(mockClient, args2);
    console.log('✅ System tables export completed');
    
    // Verify the output
    if (fs.existsSync('test-system-tables-schema.json')) {
      const schema2 = JSON.parse(fs.readFileSync('test-system-tables-schema.json', 'utf8'));
      
      const checks2 = [
        { name: 'Contains test_customer', check: schema2.tables.some(t => t.logicalName === 'test_customer') },
        { name: 'Contains contact', check: schema2.tables.some(t => t.logicalName === 'contact') },
        { name: 'Excludes account', check: !schema2.tables.some(t => t.logicalName === 'account') },
        { name: 'Excludes xyz_product', check: !schema2.tables.some(t => t.logicalName === 'xyz_product') },
        { name: 'Metadata includes systemTablesToInclude', check: Array.isArray(schema2.metadata.systemTablesToInclude) && schema2.metadata.systemTablesToInclude.includes('contact') }
      ];
      
      let allPassed2 = true;
      for (const check of checks2) {
        if (check.check) {
          console.log(`  ✅ ${check.name}: PASS`);
        } else {
          console.log(`  ❌ ${check.name}: FAIL`);
          allPassed2 = false;
        }
      }
      
      if (!allPassed2) {
        throw new Error('Test 2 failed some checks');
      }
    } else {
      throw new Error('Test 2 output file not created');
    }
    
    // Test 3: Backward compatibility with prefixOnly
    console.log('\n📋 Test 3: Backward compatibility with prefixOnly');
    const args3 = {
      outputPath: 'test-prefix-only-schema.json',
      includeAllSystemTables: false,
      includeSystemColumns: false,
      includeSystemOptionSets: false,
      prefixOnly: true,  // Should use solution context prefix
      systemTablesToInclude: ['contact', 'account'],
      prettify: true
    };
    
    const result3 = await exportSolutionSchema(mockClient, args3);
    console.log('✅ Prefix-only export completed');
    
    // Verify the output
    if (fs.existsSync('test-prefix-only-schema.json')) {
      const schema3 = JSON.parse(fs.readFileSync('test-prefix-only-schema.json', 'utf8'));
      
      const checks3 = [
        { name: 'Contains test_customer', check: schema3.tables.some(t => t.logicalName === 'test_customer') },
        { name: 'Excludes xyz_product', check: !schema3.tables.some(t => t.logicalName === 'xyz_product') },
        { name: 'Excludes other_customtable', check: !schema3.tables.some(t => t.logicalName === 'other_customtable') },
        { name: 'Contains test_priority option set', check: schema3.globalOptionSets.some(o => o.name === 'test_priority') },
        { name: 'Excludes xyz_status option set', check: !schema3.globalOptionSets.some(o => o.name === 'xyz_status') }
      ];
      
      let allPassed3 = true;
      for (const check of checks3) {
        if (check.check) {
          console.log(`  ✅ ${check.name}: PASS`);
        } else {
          console.log(`  ❌ ${check.name}: FAIL`);
          allPassed3 = false;
        }
      }
      
      if (!allPassed3) {
        throw new Error('Test 3 failed some checks');
      }
    } else {
      throw new Error('Test 3 output file not created');
    }
    
    // Clean up test files
    const testFiles = [
      'test-multi-prefix-schema.json',
      'test-system-tables-schema.json', 
      'test-prefix-only-schema.json'
    ];
    
    for (const file of testFiles) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    }
    
    console.log('\n🎉 All enhanced schema export tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Clean up test files on error
    const testFiles = [
      'test-multi-prefix-schema.json',
      'test-system-tables-schema.json', 
      'test-prefix-only-schema.json'
    ];
    
    for (const file of testFiles) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }
    
    process.exit(1);
  }
}

// Run the test
testEnhancedSchemaExport();