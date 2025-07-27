const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Schema Export Tool...\n');

// Test 1: Export custom schema only (default)
console.log('📋 Test 1: Export custom schema only (default settings)');
try {
  const result = execSync(`node ../build/index.js`, {
    input: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "export_solution_schema",
        arguments: {
          outputPath: "test-schema-custom.json"
        }
      }
    }),
    encoding: 'utf8',
    cwd: __dirname
  });

  const response = JSON.parse(result);
  if (response.result) {
    console.log('✅ Custom schema export successful');
    console.log(response.result);
    
    // Check if file was created
    const filePath = path.join(__dirname, 'test-schema-custom.json');
    if (fs.existsSync(filePath)) {
      const fileStats = fs.statSync(filePath);
      console.log(`📁 File created: ${filePath} (${(fileStats.size / 1024).toFixed(2)} KB)`);
      
      // Parse and validate JSON structure
      const schemaData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log(`📊 Schema contains:`);
      console.log(`   - Tables: ${schemaData.tables?.length || 0}`);
      console.log(`   - Global Option Sets: ${schemaData.globalOptionSets?.length || 0}`);
      console.log(`   - Relationships: ${schemaData.relationships?.length || 0}`);
      console.log(`   - Export Date: ${schemaData.metadata?.exportedAt}`);
      if (schemaData.metadata?.solutionUniqueName) {
        console.log(`   - Solution: ${schemaData.metadata.solutionDisplayName} (${schemaData.metadata.solutionUniqueName})`);
      }
    }
  } else {
    console.log('❌ Custom schema export failed:', response.error);
  }
} catch (error) {
  console.log('❌ Custom schema export failed:', error.message);
}

console.log('\n' + '='.repeat(60) + '\n');

// Test 2: Export with system tables included
console.log('📋 Test 2: Export with system tables included');
try {
  const result = execSync(`node ../build/index.js`, {
    input: JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "export_solution_schema",
        arguments: {
          outputPath: "test-schema-with-system.json",
          includeSystemTables: true,
          includeSystemColumns: true,
          includeSystemOptionSets: true
        }
      }
    }),
    encoding: 'utf8',
    cwd: __dirname
  });

  const response = JSON.parse(result);
  if (response.result) {
    console.log('✅ System schema export successful');
    console.log(response.result);
    
    // Check if file was created
    const filePath = path.join(__dirname, 'test-schema-with-system.json');
    if (fs.existsSync(filePath)) {
      const fileStats = fs.statSync(filePath);
      console.log(`📁 File created: ${filePath} (${(fileStats.size / 1024).toFixed(2)} KB)`);
      
      // Parse and validate JSON structure
      const schemaData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log(`📊 Schema contains:`);
      console.log(`   - Tables: ${schemaData.tables?.length || 0}`);
      console.log(`   - Global Option Sets: ${schemaData.globalOptionSets?.length || 0}`);
      console.log(`   - Relationships: ${schemaData.relationships?.length || 0}`);
      console.log(`   - Export Date: ${schemaData.metadata?.exportedAt}`);
      if (schemaData.metadata?.solutionUniqueName) {
        console.log(`   - Solution: ${schemaData.metadata.solutionDisplayName} (${schemaData.metadata.solutionUniqueName})`);
      }
    }
  } else {
    console.log('❌ System schema export failed:', response.error);
  }
} catch (error) {
  console.log('❌ System schema export failed:', error.message);
}

console.log('\n' + '='.repeat(60) + '\n');

// Test 3: Export minified JSON
console.log('📋 Test 3: Export minified JSON');
try {
  const result = execSync(`node ../build/index.js`, {
    input: JSON.stringify({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "export_solution_schema",
        arguments: {
          outputPath: "test-schema-minified.json",
          prettify: false
        }
      }
    }),
    encoding: 'utf8',
    cwd: __dirname
  });

  const response = JSON.parse(result);
  if (response.result) {
    console.log('✅ Minified schema export successful');
    console.log(response.result);
    
    // Check if file was created
    const filePath = path.join(__dirname, 'test-schema-minified.json');
    if (fs.existsSync(filePath)) {
      const fileStats = fs.statSync(filePath);
      console.log(`📁 File created: ${filePath} (${(fileStats.size / 1024).toFixed(2)} KB)`);
      
      // Verify it's minified (no pretty formatting)
      const content = fs.readFileSync(filePath, 'utf8');
      const isMinified = !content.includes('\n  '); // Check for indentation
      console.log(`📦 Format: ${isMinified ? 'Minified' : 'Pretty-printed'}`);
    }
  } else {
    console.log('❌ Minified schema export failed:', response.error);
  }
} catch (error) {
  console.log('❌ Minified schema export failed:', error.message);
}

console.log('\n' + '='.repeat(60) + '\n');

// Test 4: Export to subdirectory
console.log('📋 Test 4: Export to subdirectory');
try {
  const result = execSync(`node ../build/index.js`, {
    input: JSON.stringify({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "export_solution_schema",
        arguments: {
          outputPath: "exports/solution-schema.json"
        }
      }
    }),
    encoding: 'utf8',
    cwd: __dirname
  });

  const response = JSON.parse(result);
  if (response.result) {
    console.log('✅ Subdirectory schema export successful');
    console.log(response.result);
    
    // Check if file was created in subdirectory
    const filePath = path.join(__dirname, 'exports', 'solution-schema.json');
    if (fs.existsSync(filePath)) {
      const fileStats = fs.statSync(filePath);
      console.log(`📁 File created: ${filePath} (${(fileStats.size / 1024).toFixed(2)} KB)`);
    }
  } else {
    console.log('❌ Subdirectory schema export failed:', response.error);
  }
} catch (error) {
  console.log('❌ Subdirectory schema export failed:', error.message);
}

console.log('\n🎉 Schema export testing completed!');
console.log('\n📁 Generated files:');
console.log('   - test-schema-custom.json (custom entities only)');
console.log('   - test-schema-with-system.json (includes system entities)');
console.log('   - test-schema-minified.json (minified format)');
console.log('   - exports/solution-schema.json (in subdirectory)');