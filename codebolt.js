#!/usr/bin/env node



const { program } = require('commander');
const { getVersion } = require('./actions/version');
const { uploadFolder } = require('./actions/uploadfolder');
const inquirer = require('inquirer');

const {singIn,logout} = require('./actions/login')

// const { login } = require('./actions/login');
const { list } = require('./actions/list');

program.version('1.0.0');

program
    .command('version')
    .description('Check the application version')
    .action(getVersion);

program
    .command('login')
    .description('Log in to the application')
    .action(singIn);

program
    .command('logout')
    .description('Log out of the application') // Added for logout
    .action(logout); // Added for logout

program
    .command('upload <folderPath>')
    .description('Upload a folder')
    .action(uploadFolder);


program
  .command('list')
  .description('List all the agents created and uploaded by me')
  .action(list);

program.parse(process.argv);

