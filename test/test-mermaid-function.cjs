const fs = require('fs');
const path = require('path');

// Import the function directly (we'll need to simulate the client parameter)
async function testMermaidFunction() {
  console.log('🧪 Testing Mermaid diagram generation function...');
  
  try {
    // Create a simple test schema file
    const testSchema = {
      metadata: {
        exportedAt: new Date().toISOString(),
        includeSystemTables: false,
        includeSystemColumns: false,
        includeSystemOptionSets: false,
        prefixOnly: true,
        solutionUniqueName: 'TestSolution',
        solutionDisplayName: 'Test Solution',
        publisherPrefix: 'test'
      },
      tables: [
        {
          logicalName: 'test_customer',
          displayName: 'Customer',
          displayCollectionName: 'Customers',
          description: 'Customer information',
          schemaName: 'test_Customer',
          ownershipType: 'UserOwned',
          hasActivities: true,
          hasNotes: true,
          isAuditEnabled: true,
          isDuplicateDetectionEnabled: false,
          isValidForQueue: false,
          isConnectionsEnabled: false,
          isMailMergeEnabled: false,
          isDocumentManagementEnabled: false,
          isCustomEntity: true,
          isManaged: false,
          primaryNameAttribute: 'test_name',
          primaryIdAttribute: 'test_customerid',
          columns: [
            {
              logicalName: 'test_customerid',
              displayName: 'Customer ID',
              schemaName: 'test_CustomerId',
              attributeType: 'Uniqueidentifier',
              requiredLevel: 'SystemRequired',
              isAuditEnabled: true,
              isValidForAdvancedFind: false,
              isValidForCreate: false,
              isValidForUpdate: false,
              isCustomAttribute: true,
              isManaged: false,
              isPrimaryId: true,
              isPrimaryName: false
            },
            {
              logicalName: 'test_name',
              displayName: 'Customer Name',
              schemaName: 'test_Name',
              attributeType: 'String',
              requiredLevel: 'ApplicationRequired',
              isAuditEnabled: true,
              isValidForAdvancedFind: true,
              isValidForCreate: true,
              isValidForUpdate: true,
              isCustomAttribute: true,
              isManaged: false,
              isPrimaryId: false,
              isPrimaryName: true,
              maxLength: 100
            },
            {
              logicalName: 'test_email',
              displayName: 'Email Address',
              schemaName: 'test_Email',
              attributeType: 'String',
              requiredLevel: 'None',
              isAuditEnabled: true,
              isValidForAdvancedFind: true,
              isValidForCreate: true,
              isValidForUpdate: true,
              isCustomAttribute: true,
              isManaged: false,
              isPrimaryId: false,
              isPrimaryName: false,
              maxLength: 100,
              format: 'Email'
            }
          ]
        },
        {
          logicalName: 'test_order',
          displayName: 'Order',
          displayCollectionName: 'Orders',
          description: 'Customer orders',
          schemaName: 'test_Order',
          ownershipType: 'UserOwned',
          hasActivities: false,
          hasNotes: false,
          isAuditEnabled: true,
          isDuplicateDetectionEnabled: false,
          isValidForQueue: false,
          isConnectionsEnabled: false,
          isMailMergeEnabled: false,
          isDocumentManagementEnabled: false,
          isCustomEntity: true,
          isManaged: false,
          primaryNameAttribute: 'test_ordernumber',
          primaryIdAttribute: 'test_orderid',
          columns: [
            {
              logicalName: 'test_orderid',
              displayName: 'Order ID',
              schemaName: 'test_OrderId',
              attributeType: 'Uniqueidentifier',
              requiredLevel: 'SystemRequired',
              isAuditEnabled: true,
              isValidForAdvancedFind: false,
              isValidForCreate: false,
              isValidForUpdate: false,
              isCustomAttribute: true,
              isManaged: false,
              isPrimaryId: true,
              isPrimaryName: false
            },
            {
              logicalName: 'test_ordernumber',
              displayName: 'Order Number',
              schemaName: 'test_OrderNumber',
              attributeType: 'String',
              requiredLevel: 'ApplicationRequired',
              isAuditEnabled: true,
              isValidForAdvancedFind: true,
              isValidForCreate: true,
              isValidForUpdate: true,
              isCustomAttribute: true,
              isManaged: false,
              isPrimaryId: false,
              isPrimaryName: true,
              maxLength: 50
            },
            {
              logicalName: 'test_customerid',
              displayName: 'Customer',
              schemaName: 'test_CustomerId',
              attributeType: 'Lookup',
              requiredLevel: 'ApplicationRequired',
              isAuditEnabled: true,
              isValidForAdvancedFind: true,
              isValidForCreate: true,
              isValidForUpdate: true,
              isCustomAttribute: true,
              isManaged: false,
              isPrimaryId: false,
              isPrimaryName: false,
              targetEntity: 'test_customer'
            }
          ]
        }
      ],
      globalOptionSets: [],
      relationships: [
        {
          schemaName: 'test_customer_test_order',
          relationshipType: 'OneToMany',
          referencedEntity: 'test_customer',
          referencingEntity: 'test_order',
          referencingAttribute: 'test_customerid',
          isCustomRelationship: true,
          isManaged: false
        }
      ]
    };
    
    // Write test schema to file
    const testSchemaPath = 'test-schema-function.json';
    fs.writeFileSync(testSchemaPath, JSON.stringify(testSchema, null, 2));
    console.log(`✅ Created test schema file: ${testSchemaPath}`);
    
    // Import the function from the built module
    const { generateMermaidDiagram } = await import('../build/tools/schema-tools.js');
    
    // Mock client (not needed for this function)
    const mockClient = {};
    
    // Test the function directly
    const args = {
      schemaPath: testSchemaPath,
      outputPath: 'test-diagram-function.mmd',
      includeColumns: true,
      includeRelationships: true,
      maxTablesPerDiagram: 10
    };
    
    console.log('🔧 Testing generateMermaidDiagram function...');
    const result = await generateMermaidDiagram(mockClient, args);
    
    console.log('✅ Function call successful');
    console.log('📄 Result preview:', result.substring(0, 200) + '...');
    
    // Check if the Mermaid file was created
    if (fs.existsSync('test-diagram-function.mmd')) {
      const mermaidContent = fs.readFileSync('test-diagram-function.mmd', 'utf8');
      console.log('✅ Mermaid diagram file created successfully');
      console.log('📊 Diagram content:');
      console.log(mermaidContent);
      
      // Verify the content contains expected elements
      const checks = [
        { name: 'ERD declaration', check: mermaidContent.includes('erDiagram') },
        { name: 'Customer table', check: mermaidContent.includes('test_customer') },
        { name: 'Order table', check: mermaidContent.includes('test_order') },
        { name: 'Relationship', check: mermaidContent.includes('||--o{') },
        { name: 'Column types', check: mermaidContent.includes('uuid') && mermaidContent.includes('string') },
        { name: 'Primary key', check: mermaidContent.includes('PK') },
        { name: 'Required fields', check: mermaidContent.includes('NOT NULL') },
        { name: 'Metadata comments', check: mermaidContent.includes('Generated from:') }
      ];
      
      let allPassed = true;
      for (const check of checks) {
        if (check.check) {
          console.log(`✅ ${check.name}: PASS`);
        } else {
          console.log(`❌ ${check.name}: FAIL`);
          allPassed = false;
        }
      }
      
      if (allPassed) {
        console.log('🎉 All content checks passed!');
      } else {
        throw new Error('Some content checks failed');
      }
    } else {
      throw new Error('Mermaid diagram file was not created');
    }
    
    // Clean up test files
    if (fs.existsSync(testSchemaPath)) {
      fs.unlinkSync(testSchemaPath);
    }
    if (fs.existsSync('test-diagram-function.mmd')) {
      fs.unlinkSync('test-diagram-function.mmd');
    }
    
    console.log('🎉 All tests passed! Mermaid diagram generation function is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Clean up test files on error
    try {
      if (fs.existsSync('test-schema-function.json')) {
        fs.unlinkSync('test-schema-function.json');
      }
      if (fs.existsSync('test-diagram-function.mmd')) {
        fs.unlinkSync('test-diagram-function.mmd');
      }
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    process.exit(1);
  }
}

// Run the test
testMermaidFunction();