const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test the Mermaid diagram generation tool
async function testMermaidDiagramGeneration() {
  console.log('🧪 Testing Mermaid diagram generation...');
  
  try {
    // First, create a simple test schema file
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
    const testSchemaPath = 'test-schema.json';
    fs.writeFileSync(testSchemaPath, JSON.stringify(testSchema, null, 2));
    console.log(`✅ Created test schema file: ${testSchemaPath}`);
    
    // Test the MCP tool call using the built server
    const testCommand = `echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "generate_mermaid_diagram", "arguments": {"schemaPath": "${testSchemaPath}", "outputPath": "test-diagram.mmd", "includeColumns": true, "includeRelationships": true, "maxTablesPerDiagram": 10}}}' | node build/index.js`;
    
    console.log('🔧 Testing MCP tool call...');
    const result = execSync(testCommand, { encoding: 'utf8', timeout: 30000 });
    
    // Parse the JSON response
    const lines = result.trim().split('\n');
    let response = null;
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.id === 1) {
          response = parsed;
          break;
        }
      } catch (e) {
        // Skip non-JSON lines
      }
    }
    
    if (!response) {
      throw new Error('No valid JSON response found');
    }
    
    if (response.error) {
      throw new Error(`MCP tool error: ${JSON.stringify(response.error)}`);
    }
    
    console.log('✅ MCP tool call successful');
    console.log('📄 Response:', response.result.content[0].text.substring(0, 200) + '...');
    
    // Check if the Mermaid file was created
    if (fs.existsSync('test-diagram.mmd')) {
      const mermaidContent = fs.readFileSync('test-diagram.mmd', 'utf8');
      console.log('✅ Mermaid diagram file created successfully');
      console.log('📊 Diagram preview:');
      console.log(mermaidContent.substring(0, 500) + '...');
      
      // Verify the content contains expected elements
      if (mermaidContent.includes('erDiagram') && 
          mermaidContent.includes('test_customer') && 
          mermaidContent.includes('test_order') &&
          mermaidContent.includes('||--o{')) {
        console.log('✅ Mermaid diagram contains expected elements');
      } else {
        throw new Error('Mermaid diagram missing expected elements');
      }
    } else {
      throw new Error('Mermaid diagram file was not created');
    }
    
    // Clean up test files
    if (fs.existsSync(testSchemaPath)) {
      fs.unlinkSync(testSchemaPath);
    }
    if (fs.existsSync('test-diagram.mmd')) {
      fs.unlinkSync('test-diagram.mmd');
    }
    
    console.log('🎉 All tests passed! Mermaid diagram generation is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Clean up test files on error
    try {
      if (fs.existsSync('test-schema.json')) {
        fs.unlinkSync('test-schema.json');
      }
      if (fs.existsSync('test-diagram.mmd')) {
        fs.unlinkSync('test-diagram.mmd');
      }
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    process.exit(1);
  }
}

// Run the test
testMermaidDiagramGeneration();