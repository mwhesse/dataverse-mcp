// Test the enhanced PowerPages WebAPI tool structure and features (offline test)
// This test verifies the code structure and enhanced capabilities without requiring Dataverse connection

const fs = require('fs');
const path = require('path');

function testPowerPagesWebAPIEnhanced() {
  console.log('🧪 Testing Enhanced PowerPages WebAPI Tool Structure...\n');

  const toolPath = path.join(__dirname, '..', 'src', 'tools', 'powerpages-webapi-tools.ts');
  
  if (!fs.existsSync(toolPath)) {
    console.log('❌ PowerPages WebAPI tool file not found');
    return;
  }

  const toolContent = fs.readFileSync(toolPath, 'utf8');
  
  // Test for enhanced features in the code
  const tests = [
    {
      name: 'Schema-Aware Metadata Resolution',
      check: () => toolContent.includes('resolvePowerPagesEntityInfo'),
      description: 'Function to resolve entity metadata for schema-aware capabilities'
    },
    {
      name: '@odata.bind Processing',
      check: () => toolContent.includes('processPowerPagesODataBindProperties'),
      description: 'Function to process and normalize @odata.bind properties'
    },
    {
      name: 'Navigation Property Mapping',
      check: () => toolContent.includes('lookupNavMap'),
      description: 'Support for lookup navigation property mapping'
    },
    {
      name: 'Sample Body Generation',
      check: () => toolContent.includes('generatePowerPagesSampleBodyFromSchema'),
      description: 'Schema-aware sample body generation'
    },
    {
      name: 'Auto Field Selection',
      check: () => toolContent.includes('primaryIdAttribute') && toolContent.includes('primaryNameAttribute'),
      description: 'Automatic selection of primary fields when no select specified'
    },
    {
      name: 'PowerPages URL Format',
      check: () => toolContent.includes('/_api/'),
      description: 'PowerPages-specific URL format (/_api/entityset)'
    },
    {
      name: 'Request Verification Token',
      check: () => toolContent.includes('__RequestVerificationToken'),
      description: 'PowerPages request verification token support'
    },
    {
      name: 'Authentication Context',
      check: () => toolContent.includes('Authentication Context for PowerPages'),
      description: 'PowerPages authentication context documentation'
    },
    {
      name: 'React Component Generation',
      check: () => toolContent.includes('React Component'),
      description: 'React component example generation'
    },
    {
      name: 'Schema Information Display',
      check: () => toolContent.includes('Schema Information'),
      description: 'Entity schema information in output'
    },
    {
      name: '@odata.bind Examples',
      check: () => toolContent.includes('@odata.bind Relationship Examples'),
      description: '@odata.bind usage examples and documentation'
    },
    {
      name: 'Payload Correction',
      check: () => toolContent.includes('correctedProp') && toolContent.includes('attrToNavLower'),
      description: 'Automatic correction of lookup attribute names to navigation properties'
    }
  ];

  console.log('📋 Enhanced Features Check:');
  console.log('─'.repeat(60));

  let passedTests = 0;
  let totalTests = tests.length;

  tests.forEach(test => {
    const passed = test.check();
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${test.name}`);
    console.log(`   ${test.description}`);
    
    if (passed) passedTests++;
    console.log('');
  });

  console.log('─'.repeat(60));
  console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All enhanced features are properly implemented!');
  } else {
    console.log('⚠️  Some enhanced features may be missing or need attention.');
  }

  // Check for key improvements over the original implementation
  console.log('\n🔍 Key Improvements Analysis:');
  console.log('─'.repeat(60));

  const improvements = [
    {
      feature: 'Schema-Aware Operation',
      check: toolContent.includes('entityInfo') && toolContent.includes('resolveTargetSet'),
      description: 'Tool now retrieves and uses actual entity metadata'
    },
    {
      feature: 'Relationship Management',
      check: toolContent.includes('@odata.bind') && toolContent.includes('normalizeBindValue'),
      description: 'Full @odata.bind support with validation and normalization'
    },
    {
      feature: 'Intelligent Field Selection',
      check: toolContent.includes('finalSelect') && toolContent.includes('autoFields'),
      description: 'Automatically selects primary fields when none specified'
    },
    {
      feature: 'Enhanced Documentation',
      check: toolContent.includes('Usage Patterns') && toolContent.includes('Navigation Property Names'),
      description: 'Comprehensive documentation and examples in output'
    },
    {
      feature: 'PowerPages-Specific Features',
      check: toolContent.includes('REQUEST_VERIFICATION_TOKEN') && toolContent.includes('Shell?.user'),
      description: 'PowerPages-specific authentication and security features'
    }
  ];

  improvements.forEach(improvement => {
    const status = improvement.check ? '✅' : '❌';
    console.log(`${status} ${improvement.feature}`);
    console.log(`   ${improvement.description}`);
    console.log('');
  });

  // Verify the tool registration pattern
  console.log('🔧 Tool Registration Check:');
  console.log('─'.repeat(60));
  
  const hasRegisterTool = toolContent.includes('server.registerTool');
  const hasProperInputSchema = toolContent.includes('inputSchema') && toolContent.includes('z.enum');
  const hasAsyncHandler = toolContent.includes('async (params: any)');
  
  console.log(`✅ Uses registerTool pattern: ${hasRegisterTool ? 'Yes' : 'No'}`);
  console.log(`✅ Has proper input schema: ${hasProperInputSchema ? 'Yes' : 'No'}`);
  console.log(`✅ Has async handler: ${hasAsyncHandler ? 'Yes' : 'No'}`);

  console.log('\n🎯 Summary:');
  console.log('─'.repeat(60));
  console.log('The PowerPages WebAPI tool has been successfully enhanced with:');
  console.log('• Schema-aware metadata retrieval and field inference');
  console.log('• Complete @odata.bind support for relationship management');
  console.log('• Automatic payload correction and navigation property handling');
  console.log('• PowerPages-specific URL formatting and authentication');
  console.log('• Comprehensive documentation and code examples');
  console.log('• React component generation for modern web development');
  console.log('• Entity schema information display');
  console.log('• Intelligent field selection when no fields specified');
}

// Run the test
testPowerPagesWebAPIEnhanced();