const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Exporting XYZ Solution Schema...\n');

try {
  const result = execSync(`node ../build/index.js`, {
    input: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "export_solution_schema",
        arguments: {
          outputPath: "xyz-solution-schema.json",
          includeSystemTables: false,
          includeSystemColumns: false,
          includeSystemOptionSets: false,
          prettify: true
        }
      }
    }),
    encoding: 'utf8',
    cwd: __dirname
  });

  const response = JSON.parse(result);
  if (response.result) {
    console.log('✅ XYZ Solution schema export successful!');
    console.log(response.result.content[0].text);
    
    // Check if file was created and show some details
    const filePath = path.join(__dirname, 'xyz-solution-schema.json');
    if (fs.existsSync(filePath)) {
      const fileStats = fs.statSync(filePath);
      console.log(`\n📁 File Details:`);
      console.log(`   - Path: ${filePath}`);
      console.log(`   - Size: ${(fileStats.size / 1024).toFixed(2)} KB`);
      console.log(`   - Created: ${fileStats.birthtime.toISOString()}`);
      
      // Parse and show schema summary
      try {
        const schemaData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        console.log(`\n📊 Schema Summary:`);
        console.log(`   - Export Date: ${schemaData.metadata?.exportedAt}`);
        console.log(`   - Solution: ${schemaData.metadata?.solutionDisplayName || 'N/A'} (${schemaData.metadata?.solutionUniqueName || 'N/A'})`);
        console.log(`   - Publisher Prefix: ${schemaData.metadata?.publisherPrefix || 'N/A'}`);
        console.log(`   - Tables: ${schemaData.tables?.length || 0}`);
        console.log(`   - Global Option Sets: ${schemaData.globalOptionSets?.length || 0}`);
        console.log(`   - Relationships: ${schemaData.relationships?.length || 0}`);
        
        if (schemaData.tables && schemaData.tables.length > 0) {
          console.log(`\n📋 Tables in XYZ Solution:`);
          schemaData.tables.forEach((table, index) => {
            console.log(`   ${index + 1}. ${table.displayName} (${table.logicalName})`);
            console.log(`      - Columns: ${table.columns?.length || 0}`);
            console.log(`      - Custom: ${table.isCustomEntity ? 'Yes' : 'No'}`);
            console.log(`      - Ownership: ${table.ownershipType}`);
          });
        }
        
        if (schemaData.globalOptionSets && schemaData.globalOptionSets.length > 0) {
          console.log(`\n🎯 Global Option Sets:`);
          schemaData.globalOptionSets.forEach((optionSet, index) => {
            console.log(`   ${index + 1}. ${optionSet.displayName} (${optionSet.name})`);
            console.log(`      - Options: ${optionSet.options?.length || 0}`);
            console.log(`      - Custom: ${optionSet.isCustomOptionSet ? 'Yes' : 'No'}`);
          });
        }
        
        if (schemaData.relationships && schemaData.relationships.length > 0) {
          console.log(`\n🔗 Relationships:`);
          schemaData.relationships.forEach((rel, index) => {
            console.log(`   ${index + 1}. ${rel.schemaName} (${rel.relationshipType})`);
            if (rel.relationshipType === 'OneToMany') {
              console.log(`      - ${rel.referencedEntity} → ${rel.referencingEntity}`);
            } else if (rel.relationshipType === 'ManyToMany') {
              console.log(`      - ${rel.entity1LogicalName} ↔ ${rel.entity2LogicalName}`);
            }
          });
        }
        
      } catch (parseError) {
        console.log(`⚠️ Could not parse schema file: ${parseError.message}`);
      }
    }
  } else {
    console.log('❌ XYZ Solution schema export failed:', response.error);
  }
} catch (error) {
  console.log('❌ XYZ Solution schema export failed:', error.message);
}

console.log('\n🎉 XYZ Solution schema export test completed!');