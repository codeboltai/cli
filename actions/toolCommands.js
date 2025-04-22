const { spawn } = require('child_process');

function runTool(command, file) {
  console.log("Running tool");
  try {
    const args = ['@wong2/mcp-cli', command, file];
    const child = spawn('npx', args, {
      stdio: 'inherit',
    });

    child.on('error', (error) => {
      console.error('Error running tool:', error.message);
      process.exit(1);
    });

    child.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Tool process exited with code ${code}`);
        process.exit(code);
      }
    });
  } catch (error) {
    console.error('Error running tool:', error.message);
    process.exit(1);
  }
}

function inspectTool(file) {
  try {
    const child = spawn('npx', ['@modelcontextprotocol/inspector', 'node', file], {
      stdio: 'inherit',
    });

    child.on('error', () => {
      process.exit(1);
    });

    child.on('exit', (code) => {
      if (code !== 0) {
        process.exit(code);
      }
    });
  } catch {
    process.exit(1);
  }
}

module.exports = {
  runTool,
  inspectTool
}; 