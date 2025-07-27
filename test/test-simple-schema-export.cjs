const { spawn } = require('child_process');
const path = require('path');

console.log('Testing simple schema export...');

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

// Send a simple export request
const request = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "export_solution_schema",
    arguments: {
      outputPath: "simple-schema-export.json",
      includeSystemTables: false,
      includeSystemColumns: false,
      includeSystemOptionSets: false,
      prettify: true
    }
  }
};

console.log('Sending export request...');
mcp.stdin.write(JSON.stringify(request) + '\n');

// Set a timeout
setTimeout(() => {
  console.log('Timeout reached, terminating...');
  mcp.kill();
  
  // Check if file was created
  const fs = require('fs');
  if (fs.existsSync('simple-schema-export.json')) {
    console.log('✅ Schema file was created!');
    const stats = fs.statSync('simple-schema-export.json');
    console.log(`📏 File size: ${(stats.size / 1024).toFixed(2)} KB`);
    
    // Show first few lines
    const content = fs.readFileSync('simple-schema-export.json', 'utf8');
    const lines = content.split('\n').slice(0, 20);
    console.log('📄 First 20 lines:');
    console.log(lines.join('\n'));
  } else {
    console.log('❌ Schema file was not created');
  }
  
  process.exit(0);
}, 30000); // 30 second timeout

mcp.on('close', (code) => {
  console.log(`MCP server exited with code ${code}`);
  if (responseData) {
    console.log('Response data:', responseData);
  }
});