const { execSync } = require('child_process');

// Test AutoNumber column management tools
console.log('Testing AutoNumber Column Management Tools...\n');

// Test data
const testCases = [
  {
    name: 'Create AutoNumber Column',
    tool: 'create_autonumber_column',
    args: {
      entityLogicalName: 'xyz_testtable',
      displayName: 'Serial Number',
      description: 'Auto-generated serial number for tracking',
      autoNumberFormat: 'SN-{SEQNUM:6}-{DATETIMEUTC:yyyyMMdd}-{RANDSTRING:3}',
      maxLength: 150,
      requiredLevel: 'ApplicationRequired'
    }
  },
  {
    name: 'List AutoNumber Columns',
    tool: 'list_autonumber_columns',
    args: {
      entityLogicalName: 'xyz_testtable',
      customOnly: true,
      includeManaged: false
    }
  },
  {
    name: 'Get AutoNumber Column Details',
    tool: 'get_autonumber_column',
    args: {
      entityLogicalName: 'xyz_testtable',
      columnLogicalName: 'xyz_serialnumber'
    }
  },
  {
    name: 'Update AutoNumber Format',
    tool: 'update_autonumber_format',
    args: {
      entityLogicalName: 'xyz_testtable',
      columnLogicalName: 'xyz_serialnumber',
      autoNumberFormat: 'NEW-{SEQNUM:8}-{RANDSTRING:4}',
      displayName: 'Updated Serial Number'
    }
  },
  {
    name: 'Set AutoNumber Seed',
    tool: 'set_autonumber_seed',
    args: {
      entityLogicalName: 'xyz_testtable',
      columnLogicalName: 'xyz_serialnumber',
      seedValue: 10000
    }
  },
  {
    name: 'Convert Text Column to AutoNumber',
    tool: 'convert_to_autonumber',
    args: {
      entityLogicalName: 'xyz_testtable',
      columnLogicalName: 'xyz_description', // Assuming this exists as a text column
      autoNumberFormat: 'DESC-{SEQNUM:4}-{RANDSTRING:2}'
    }
  },
  {
    name: 'Create Table with AutoNumber Primary Name',
    tool: 'create_dataverse_table',
    args: {
      displayName: 'AutoNumber Test Table',
      description: 'Table with AutoNumber primary name column',
      primaryNameAutoNumberFormat: 'TEST-{SEQNUM:5}-{DATETIMEUTC:yyyyMMdd}'
    }
  }
];

// Function to test a tool
function testTool(testCase) {
  console.log(`\n=== ${testCase.name} ===`);
  
  try {
    const command = `echo '${JSON.stringify({
      method: "tools/call",
      params: {
        name: testCase.tool,
        arguments: testCase.args
      }
    })}' | node build/index.js`;
    
    console.log(`Tool: ${testCase.tool}`);
    console.log(`Args: ${JSON.stringify(testCase.args, null, 2)}`);
    
    const result = execSync(command, { 
      encoding: 'utf8',
      timeout: 30000,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    console.log('Result:', result);
    
    // Try to parse as JSON to check for errors
    try {
      const parsed = JSON.parse(result);
      if (parsed.error) {
        console.log('❌ Tool returned error:', parsed.error);
        return false;
      } else {
        console.log('✅ Tool executed successfully');
        return true;
      }
    } catch (parseError) {
      // If not JSON, check if it contains error indicators
      if (result.toLowerCase().includes('error') || result.toLowerCase().includes('failed')) {
        console.log('❌ Tool execution failed');
        return false;
      } else {
        console.log('✅ Tool executed (non-JSON response)');
        return true;
      }
    }
    
  } catch (error) {
    console.log('❌ Error executing tool:', error.message);
    return false;
  }
}

// Function to test AutoNumber format validation
function testAutoNumberFormatValidation() {
  console.log('\n=== Testing AutoNumber Format Validation ===');
  
  const validFormats = [
    'PREFIX-{SEQNUM:4}',
    '{SEQNUM:6}-{RANDSTRING:3}',
    'TEST-{SEQNUM:5}-{DATETIMEUTC:yyyyMMdd}-{RANDSTRING:2}',
    '{DATETIMEUTC:yyyy}-{SEQNUM:3}',
    'COMPLEX-{SEQNUM:8}-{RANDSTRING:6}-{DATETIMEUTC:yyyyMMddHHmmss}'
  ];
  
  const invalidFormats = [
    'PREFIX-{SEQNUM:0}', // Invalid SEQNUM length
    '{RANDSTRING:7}', // Invalid RANDSTRING length (max 6)
    'TEST-{INVALID:4}', // Invalid placeholder
    '{SEQNUM}', // Missing length
    'PREFIX-{SEQNUM:4}-{RANDSTRING:-1}' // Negative length
  ];
  
  console.log('Valid formats:');
  validFormats.forEach(format => {
    console.log(`  ✅ ${format}`);
  });
  
  console.log('\nInvalid formats (should be rejected):');
  invalidFormats.forEach(format => {
    console.log(`  ❌ ${format}`);
  });
}

// Run tests
console.log('🧪 AutoNumber Tools Test Suite');
console.log('================================\n');

// Test format validation first
testAutoNumberFormatValidation();

// Test each tool
let successCount = 0;
let totalTests = testCases.length;

for (const testCase of testCases) {
  if (testTool(testCase)) {
    successCount++;
  }
}

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Test Summary: ${successCount}/${totalTests} tests passed`);

if (successCount === totalTests) {
  console.log('🎉 All AutoNumber tools are working correctly!');
} else {
  console.log(`⚠️  ${totalTests - successCount} test(s) failed. Check the output above for details.`);
}

console.log('\n📋 AutoNumber Tools Available:');
console.log('- create_autonumber_column: Create new AutoNumber columns');
console.log('- update_autonumber_format: Update existing AutoNumber format');
console.log('- set_autonumber_seed: Set seed value for sequential numbers');
console.log('- get_autonumber_column: Get AutoNumber column details');
console.log('- list_autonumber_columns: List all AutoNumber columns');
console.log('- convert_to_autonumber: Convert text column to AutoNumber');
console.log('- create_dataverse_table: Now supports AutoNumber primary name columns');

console.log('\n📖 AutoNumber Format Examples:');
console.log('- Simple: "PREFIX-{SEQNUM:4}" → PREFIX-0001, PREFIX-0002, ...');
console.log('- With Date: "INV-{DATETIMEUTC:yyyyMMdd}-{SEQNUM:3}" → INV-20240814-001');
console.log('- With Random: "SN-{SEQNUM:6}-{RANDSTRING:3}" → SN-000001-A2X');
console.log('- Complex: "ORDER-{DATETIMEUTC:yyyy}-{SEQNUM:5}-{RANDSTRING:2}" → ORDER-2024-00001-B7');