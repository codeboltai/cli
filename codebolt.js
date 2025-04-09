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
const { spawn } = require('child_process');
const { publishAgent } = require('./actions/publishAgent');
const { pullAgent } = require('./actions/pullAgent');

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
  .command('startagent [workingDir]')
  .description('Start an agent in the specified working directory')
  .action(startAgent);

program
  .command('pullagent [workingDir]')
  .description('Pull the latest agent configuration from server')
  .action(pullAgent);

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
  .command('runtool <command> <file>')
  .description('Run a specified tool with a required file')
  .action((command, file) => {
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
  });

program
  .command('inspecttool <file>')
  .description('Inspect a server file')
  .action((file) => {
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
  });


program.parse(process.argv);

