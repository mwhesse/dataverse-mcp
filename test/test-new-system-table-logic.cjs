const fs = require('fs');

// Test the new system table inclusion logic
async function testNewSystemTableLogic() {
  console.log('🧪 Testing new system table inclusion logic...');
  
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
              }
            ]
          };
        }
        
        if (url.includes('EntityDefinitions')) {
          // Return different results based on filter
          if (url.includes('$filter=')) {
            if (url.includes('IsCustomEntity eq true or (LogicalName eq \'contact\')')) {
              // includeAllSystemTables: false, systemTablesToInclude: ['contact']
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
                  }
                ]
              };
            } else if (url.includes('IsCustomEntity eq true')) {
              // includeAllSystemTables: false, no system tables
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
                  }
                ]
              };
            }
          } else {
            // includeAllSystemTables: true, no filter
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
                  LogicalName: 'systemuser',
                  DisplayName: { UserLocalizedLabel: { Label: 'User' } },
                  DisplayCollectionName: { UserLocalizedLabel: { Label: 'Users' } },
                  SchemaName: 'SystemUser',
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
                  PrimaryIdAttribute: 'systemuserid'
                }
              ]
            };
          }
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
    
    // Test 1: includeAllSystemTables: true (should include ALL system tables)
    console.log('\n📋 Test 1: includeAllSystemTables: true');
    const args1 = {
      outputPath: 'test-all-system-tables.json',
      includeAllSystemTables: true,
      includeSystemColumns: false,
      includeSystemOptionSets: false,
      systemTablesToInclude: ['contact'], // This should be ignored
      prettify: true
    };
    
    const result1 = await exportSolutionSchema(mockClient, args1);
    console.log('✅ All system tables export completed');
    
    // Verify the output
    if (fs.existsSync('test-all-system-tables.json')) {
      const schema1 = JSON.parse(fs.readFileSync('test-all-system-tables.json', 'utf8'));
      
      const checks1 = [
        { name: 'Contains test_customer', check: schema1.tables.some(t => t.logicalName === 'test_customer') },
        { name: 'Contains contact', check: schema1.tables.some(t => t.logicalName === 'contact') },
        { name: 'Contains account', check: schema1.tables.some(t => t.logicalName === 'account') },
        { name: 'Contains systemuser', check: schema1.tables.some(t => t.logicalName === 'systemuser') },
        { name: 'Metadata shows includeAllSystemTables: true', check: schema1.metadata.includeAllSystemTables === true }
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
    
    // Test 2: includeAllSystemTables: false with systemTablesToInclude
    console.log('\n📋 Test 2: includeAllSystemTables: false with systemTablesToInclude');
    const args2 = {
      outputPath: 'test-selected-system-tables.json',
      includeAllSystemTables: false,
      includeSystemColumns: false,
      includeSystemOptionSets: false,
      systemTablesToInclude: ['contact'], // Only contact should be included
      prettify: true
    };
    
    const result2 = await exportSolutionSchema(mockClient, args2);
    console.log('✅ Selected system tables export completed');
    
    // Verify the output
    if (fs.existsSync('test-selected-system-tables.json')) {
      const schema2 = JSON.parse(fs.readFileSync('test-selected-system-tables.json', 'utf8'));
      
      const checks2 = [
        { name: 'Contains test_customer', check: schema2.tables.some(t => t.logicalName === 'test_customer') },
        { name: 'Contains contact', check: schema2.tables.some(t => t.logicalName === 'contact') },
        { name: 'Excludes account', check: !schema2.tables.some(t => t.logicalName === 'account') },
        { name: 'Excludes systemuser', check: !schema2.tables.some(t => t.logicalName === 'systemuser') },
        { name: 'Metadata shows includeAllSystemTables: false', check: schema2.metadata.includeAllSystemTables === false },
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
    
    // Test 3: includeAllSystemTables: false with empty systemTablesToInclude
    console.log('\n📋 Test 3: includeAllSystemTables: false with empty systemTablesToInclude');
    const args3 = {
      outputPath: 'test-no-system-tables.json',
      includeAllSystemTables: false,
      includeSystemColumns: false,
      includeSystemOptionSets: false,
      systemTablesToInclude: [], // No system tables
      prettify: true
    };
    
    const result3 = await exportSolutionSchema(mockClient, args3);
    console.log('✅ No system tables export completed');
    
    // Verify the output
    if (fs.existsSync('test-no-system-tables.json')) {
      const schema3 = JSON.parse(fs.readFileSync('test-no-system-tables.json', 'utf8'));
      
      const checks3 = [
        { name: 'Contains test_customer', check: schema3.tables.some(t => t.logicalName === 'test_customer') },
        { name: 'Excludes contact', check: !schema3.tables.some(t => t.logicalName === 'contact') },
        { name: 'Excludes account', check: !schema3.tables.some(t => t.logicalName === 'account') },
        { name: 'Excludes systemuser', check: !schema3.tables.some(t => t.logicalName === 'systemuser') },
        { name: 'Metadata shows includeAllSystemTables: false', check: schema3.metadata.includeAllSystemTables === false },
        { name: 'Metadata shows empty systemTablesToInclude', check: Array.isArray(schema3.metadata.systemTablesToInclude) && schema3.metadata.systemTablesToInclude.length === 0 }
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
      'test-all-system-tables.json',
      'test-selected-system-tables.json', 
      'test-no-system-tables.json'
    ];
    
    for (const file of testFiles) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    }
    
    console.log('\n🎉 All new system table logic tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Clean up test files on error
    const testFiles = [
      'test-all-system-tables.json',
      'test-selected-system-tables.json', 
      'test-no-system-tables.json'
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
testNewSystemTableLogic();