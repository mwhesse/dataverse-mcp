const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Exporting XYZ Prefix Schema with Global Option Sets...\n');

try {
  const result = execSync(`node ../build/index.js`, {
    input: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "export_solution_schema",
        arguments: {
          outputPath: "xyz-prefix-schema.json",
          includeSystemTables: false,
          includeSystemColumns: false,
          includeSystemOptionSets: false,
          prefixOnly: true,
          prettify: true
        }
      }
    }),
    encoding: 'utf8',
    cwd: __dirname
  });

  const response = JSON.parse(result);
  if (response.result) {
    console.log('✅ XYZ Prefix schema export successful!');
    console.log(response.result.content[0].text);
    
    // Check if file was created and show some details
    const filePath = path.join(__dirname, 'xyz-prefix-schema.json');
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
        console.log(`   - Prefix Only: ${schemaData.metadata?.prefixOnly ? 'Yes' : 'No'}`);
        console.log(`   - Tables: ${schemaData.tables?.length || 0}`);
        console.log(`   - Global Option Sets: ${schemaData.globalOptionSets?.length || 0}`);
        console.log(`   - Relationships: ${schemaData.relationships?.length || 0}`);
        
        if (schemaData.tables && schemaData.tables.length > 0) {
          console.log(`\n📋 XYZ Prefix Tables:`);
          schemaData.tables.forEach((table, index) => {
            console.log(`   ${index + 1}. ${table.displayName} (${table.logicalName})`);
            console.log(`      - Columns: ${table.columns?.length || 0}`);
            console.log(`      - Custom: ${table.isCustomEntity ? 'Yes' : 'No'}`);
            console.log(`      - Ownership: ${table.ownershipType}`);
            
            // Show some column details
            if (table.columns && table.columns.length > 0) {
              const customColumns = table.columns.filter(col => col.isCustomAttribute);
              if (customColumns.length > 0) {
                console.log(`      - Custom Columns: ${customColumns.map(col => col.logicalName).join(', ')}`);
              }
            }
          });
        }
        
        if (schemaData.globalOptionSets && schemaData.globalOptionSets.length > 0) {
          console.log(`\n🎯 XYZ Global Option Sets:`);
          schemaData.globalOptionSets.forEach((optionSet, index) => {
            console.log(`   ${index + 1}. ${optionSet.displayName} (${optionSet.name})`);
            console.log(`      - Options: ${optionSet.options?.length || 0}`);
            console.log(`      - Custom: ${optionSet.isCustomOptionSet ? 'Yes' : 'No'}`);
            
            // Show option details for XYZ Priority specifically
            if (optionSet.name && optionSet.name.toLowerCase().includes('priority')) {
              console.log(`      - 🌟 Priority Option Set Found!`);
              if (optionSet.options && optionSet.options.length > 0) {
                console.log(`      - Option Values:`);
                optionSet.options.forEach(option => {
                  console.log(`        • ${option.label} (${option.value})`);
                });
              }
            }
          });
        }
        
        if (schemaData.relationships && schemaData.relationships.length > 0) {
          console.log(`\n🔗 XYZ Relationships:`);
          schemaData.relationships.forEach((rel, index) => {
            console.log(`   ${index + 1}. ${rel.schemaName} (${rel.relationshipType})`);
            if (rel.relationshipType === 'OneToMany') {
              console.log(`      - ${rel.referencedEntity} → ${rel.referencingEntity}`);
            } else if (rel.relationshipType === 'ManyToMany') {
              console.log(`      - ${rel.entity1LogicalName} ↔ ${rel.entity2LogicalName}`);
            }
          });
        }
        
        // Check specifically for XYZ Priority option set
        const xyzPriorityOptionSet = schemaData.globalOptionSets?.find(os => 
          os.name && os.name.toLowerCase().includes('xyz') && os.name.toLowerCase().includes('priority')
        );
        
        if (xyzPriorityOptionSet) {
          console.log(`\n🎉 SUCCESS: XYZ Priority option set found in export!`);
          console.log(`   - Name: ${xyzPriorityOptionSet.name}`);
          console.log(`   - Display Name: ${xyzPriorityOptionSet.displayName}`);
          console.log(`   - Options Count: ${xyzPriorityOptionSet.options?.length || 0}`);
        } else {
          console.log(`\n⚠️  WARNING: XYZ Priority option set not found in export`);
          console.log(`   - Available option sets: ${schemaData.globalOptionSets?.map(os => os.name).join(', ') || 'None'}`);
        }
        
      } catch (parseError) {
        console.log(`⚠️ Could not parse schema file: ${parseError.message}`);
      }
    }
  } else {
    console.log('❌ XYZ Prefix schema export failed:', response.error);
  }
} catch (error) {
  console.log('❌ XYZ Prefix schema export failed:', error.message);
}

console.log('\n🎉 XYZ Prefix schema export test completed!');