#!/usr/bin/env node
const { program } = require('commander');
const { getVersion } = require('./actions/version');
// const { uploadFolder } = require('./actions/uploadfolder');
const inquirer = require('inquirer');

const {signIn,logout} = require('./actions/login')
// const { login } = require('./actions/login');
const { list } = require('./actions/list');
const {startAgent} = require('./actions/startAgent')
const { createagent } = require('./actions/createagent');
const {createtool} = require("./actions/createtool")
const { publishAgent } = require('./actions/publishAgent');
const { publishTool } = require('./actions/publishTool');
const { pullAgent } = require('./actions/pullAgent');
const { pullTool } = require('./actions/pullTool');
const { listTools } = require('./actions/listTools');
const { runTool, inspectTool } = require('./actions/toolCommands');
const { spawn } = require('child_process');
const { cloneAgent } = require('./actions/cloneAgent');
const { init } = require('./actions/init');
const { createprovider } = require('./actions/createprovider');
const { publishProvider } = require('./actions/publishProvider');

program.version('1.0.1');

program
    .command('version')
    .description('Check the application version')
    .action(getVersion);

program
    .command('login')
    .description('Log in to the application')
    .action(signIn);

program
    .command('logout')
    .description('Log out of the application') // Added for logout
    .action(logout); // Added for logout


program
    .command('createagent')
    .description('Create a new Codebolt Agent')
    .option('-n, --name <name>', 'name of the project')
    .option('--quick', 'create agent quickly with default settings')
    .action((options) => {
        createagent(options);
    });

program
    .command('publishagent [folderPath]')
    .description('Upload a folder')
    .action(publishAgent)

program
  .command('listagents')
  .description('List all the agents created and uploaded by me')
  .action(list);

program
  .command('listtools')
  .description('List all the MCP tools published by me')
  .action(listTools);

program
  .command('startagent [workingDir]')
  .description('Start an agent in the specified working directory')
  .action(startAgent);

program
  .command('pullagent [workingDir]')
  .description('Pull the latest agent configuration from server')
  .action(pullAgent);

program
  .command('pulltool [workingDir]')
  .description('Pull the latest MCP tool configuration from server')
  .action(pullTool);



program
  .command('createtool')
  .description('Create a new Codebolt Tool')
  .option('-n, --name <name>', 'name of the Tool')
  .option('-i, --id <unique-id>', 'unique identifier for the tool (no spaces)')
  .option('-d, --description <description>', 'description of the tool')
  .option('-p, --parameters <json>', 'tool parameters in JSON format (e.g., \'{"param1": "value1"}\')')
  .action((options) => {
      createtool(options);
  });

program
  .command('publishtool [folderPath]')
  .description('Publish a MCP tool to the registry')
  .action(publishTool);

program
  .command('runtool <command> <file>')
  .description('Run a specified tool with a required file')
  .action(runTool);

 

program
  .command('inspecttool <file>')
  .description('Inspect a server file')
  .action((file) => {
    try {
      console.log(file)
      const child = spawn('npx', ['@modelcontextprotocol/inspector', 'node', file], {
        stdio: 'inherit',
      });

      console.log(child)

      console.log('Inspector process started for file:', file);

      child.on('error', (error) => {
        console.error('Error starting inspector process:', error.message);
        process.exit(1);
      });

      child.on('exit', (code) => {
        if (code !== 0) {
          console.error(`Inspector process exited with code ${code}`);
          process.exit(code);
        } else {
          console.log('Inspector process completed successfully.');
        }
      });
    } catch (error) {
      console.error('Unexpected error:', error.message);
      process.exit(1);
    }
  });

program
  .command('cloneagent <unique_id> [targetDir]')
  .description('Clone an agent using its unique_id to the specified directory (defaults to current directory)')
  .action((unique_id, targetDir) => {
    cloneAgent(unique_id, targetDir);
  });

program
  .command('init')
  .description('Initialize the Codebolt CLI')
  .action(init);

program
  .command('createprovider')
  .description('Create a new Codebolt Provider')
  .option('-n, --name <name>', 'name of the provider')
  .option('--quick', 'create provider quickly with default settings')
  .action((options) => {
      createprovider(options);
  });
program
  .command('publishprovider [folderPath]')
  .description('Publish a Codebolt Provider to the registry')
  .action((options) => {
    publishProvider(options);
  });


program.parse(process.argv);

