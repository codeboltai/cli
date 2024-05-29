#!/usr/bin/env node



const { program } = require('commander');
const { getVersion } = require('./actions/version');
const { uploadFolder } = require('./actions/uploadfolder');
const inquirer = require('inquirer');

const {sinIn,logout} = require('./actions/login')


program.version('1.0.0');

program
    .command('version')
    .description('Check the application version')
    .action(getVersion);

program
    .command('login')
    .description('Log in to the application')
    .action(sinIn);

program
    .command('logout')
    .description('Log out of the application') // Added for logout
    .action(logout); // Added for logout

program
    .command('upload <folderPath>')
    .description('Upload a folder')
    .action(uploadFolder);

program.parse(process.argv);

