const { spawn } = require('child_process');
const path = require('path');

console.log('Testing prefix filtering functionality...');

// Use the MCP server directly
const serverPath = path.join(__dirname, '..', 'build', 'index.js');

const mcp = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: path.join(__dirname, '..')
});

let responseData = '';

mcp.stdout.on('data', (data) => {
  responseData += data.toString();
});

mcp.stderr.on('data', (data) => {
  console.error('MCP Error:', data.toString());
});

// Send a prefix-only export request
const request = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "export_solution_schema",
    arguments: {
      outputPath: "xyz-prefix-only-schema.json",
      includeSystemTables: false,
      includeSystemColumns: false,
      includeSystemOptionSets: false,
      prefixOnly: true,
      prettify: true
    }
  }
};

console.log('Sending prefix-only export request...');
mcp.stdin.write(JSON.stringify(request) + '\n');

// Set a timeout
setTimeout(() => {
  console.log('Timeout reached, terminating...');
  mcp.kill();
  
  // Check if file was created
  const fs = require('fs');
  if (fs.existsSync('xyz-prefix-only-schema.json')) {
    console.log('✅ Prefix-filtered schema file was created!');
    const stats = fs.statSync('xyz-prefix-only-schema.json');
    console.log(`📏 File size: ${(stats.size / 1024).toFixed(2)} KB`);
    
    // Show first few lines to verify structure
    const content = fs.readFileSync('xyz-prefix-only-schema.json', 'utf8');
    const lines = content.split('\n').slice(0, 30);
    console.log('📄 First 30 lines:');
    console.log(lines.join('\n'));
    
    // Check if it contains xyz_ tables
    if (content.includes('"xyz_')) {
      console.log('✅ Contains xyz_ prefixed tables');
    } else {
      console.log('❌ No xyz_ prefixed tables found');
    }
    
    // Check metadata for prefixOnly flag
    if (content.includes('"prefixOnly": true')) {
      console.log('✅ Metadata shows prefixOnly: true');
    } else {
      console.log('❌ Metadata missing prefixOnly flag');
    }
  } else {
    console.log('❌ Prefix-filtered schema file was not created');
  }
  
  process.exit(0);
}, 30000); // 30 second timeout

mcp.on('close', (code) => {
  console.log(`MCP server exited with code ${code}`);
  if (responseData) {
    console.log('Response data:', responseData);
  }
});