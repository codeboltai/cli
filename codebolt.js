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
const { createplugin } = require('./actions/createplugin');
const { publishPlugin } = require('./actions/publishPlugin');
const { createskill } = require('./actions/createskill');
const { publishSkill } = require('./actions/publishSkill');
const { createactionblock } = require('./actions/createactionblock');
const { publishActionBlock } = require('./actions/publishActionBlock');
const { createcapability } = require('./actions/createcapability');
const { createexecutor } = require('./actions/createexecutor');
const { publishExecutor } = require('./actions/publishExecutor');
const { publishCapability } = require('./actions/publishCapability');

program.version('1.0.1');

program
    .command('version')
    .description('Check the application version')
    .action(getVersion);

program
    .command('login')
    .description('Log in to the application')
    .option('-t, --token <token>', 'Login token for authentication (skip browser login)')
    .action((options) => signIn(options));

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

program
  .command('createplugin')
  .description('Create a new Codebolt Plugin')
  .option('-n, --name <name>', 'name of the plugin')
  .option('--quick', 'create plugin quickly with default settings')
  .action((options) => {
    createplugin(options);
  });

program
  .command('publishplugin [folderPath]')
  .description('Publish a Codebolt Plugin to the registry')
  .action((folderPath) => {
    publishPlugin(folderPath);
  });

program
  .command('createskill')
  .description('Create a new Codebolt Skill')
  .option('-n, --name <name>', 'name of the skill')
  .option('--quick', 'create skill quickly with default settings')
  .action((options) => {
    createskill(options);
  });

program
  .command('publishskill [folderPath]')
  .description('Publish a Codebolt Skill to the registry')
  .action((folderPath) => {
    publishSkill(folderPath);
  });

program
  .command('createactionblock')
  .description('Create a new Codebolt ActionBlock')
  .option('-n, --name <name>', 'name of the actionblock')
  .option('--quick', 'create actionblock quickly with default settings')
  .action((options) => {
    createactionblock(options);
  });

program
  .command('publishactionblock [folderPath]')
  .description('Publish a Codebolt ActionBlock to the registry')
  .action((folderPath) => {
    publishActionBlock(folderPath);
  });

program
  .command('createcapability')
  .description('Create a new Codebolt Capability')
  .option('-n, --name <name>', 'name of the capability')
  .option('--quick', 'create capability quickly with default settings')
  .action((options) => {
    createcapability(options);
  });

program
  .command('publishcapability [folderPath]')
  .description('Publish a Codebolt Capability to the registry')
  .action((folderPath) => {
    publishCapability(folderPath);
  });

program
  .command('createexecutor')
  .description('Create a new Codebolt Capability Executor')
  .option('-n, --name <name>', 'name of the executor')
  .option('--quick', 'create executor quickly with default settings')
  .action((options) => {
    createexecutor(options);
  });

program
  .command('publishexecutor [folderPath]')
  .description('Publish a Codebolt Capability Executor to the registry')
  .action((folderPath) => {
    publishExecutor(folderPath);
  });

program.parse(process.argv);

