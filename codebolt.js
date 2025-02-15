#!/usr/bin/env node
const { program } = require('commander');
const { getVersion } = require('./actions/version');
const { uploadFolder } = require('./actions/uploadfolder');
const inquirer = require('inquirer');

const {signIn,logout} = require('./actions/login')
// const { login } = require('./actions/login');
const { list } = require('./actions/list');
const {startAgent} = require('./actions/startAgent')
const { createagent } = require('./actions/createagent');
const {createtool} = require("./actions/createtool")

program.version('1.0.1');

program
    .command('version')
    .description('Check the application version')
    .action(getVersion);

program
    .command('createagent')
    .description('Create a new Codebolt Agent')
    .option('-n, --name <name>', 'name of the project')
    .option('--quick', 'create agent quickly with default settings')
    .action((options) => {
        createagent(options);
    });

program
    .command('createtool')
    .description('Create a new Codebolt Tool')
    .option('-n, --name <name>', 'name of the Tool')
    .action((options) => {
        createtool(options);
    });

program
    .command('login')
    .description('Log in to the application')
    .action(signIn);

program
    .command('logout')
    .description('Log out of the application') // Added for logout
    .action(logout); // Added for logout

program
    .command('publish [folderPath]')
    .description('Upload a folder')
    .action(uploadFolder)

program
  .command('list')
  .description('List all the agents created and uploaded by me')
  .action(list);

program
  .command('start-agent [workingDir]')
  .description('Start an agent in the specified working directory')
  .action(startAgent);


program.parse(process.argv);

