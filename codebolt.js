#!/usr/bin/env node

const { program } = require('commander');
const { getVersion } = require('./actions/version');
const { uploadFolder } = require('./actions/uploadfolder');
const { login } = require('./actions/login');
const { list } = require('./actions/list');

program.version('1.0.0');
program
  .command('version')
  .description('Check the application version')
  .action(getVersion);

program
  .command('upload <folderPath>')
  .description('Upload a folder')
  .action(uploadFolder);

program
  .command('login')
  .description('Login to the application')
  .action(login);

program
  .command('list')
  .description('List all the agents created and uploaded by me')
  .action(list);

program.parse(process.argv);
