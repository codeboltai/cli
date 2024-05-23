#!/usr/bin/env node

const { program } = require('commander');
const { getVersion } = require('./actions/version');
const { uploadFolder } = require('./actions/uploadfolder');

program.version('1.0.0');
program
  .command('version')
  .description('Check the application version')
  .action(getVersion);

program
  .command('upload <folderPath>')
  .description('Upload a folder')
  .action(uploadFolder);

program.parse(process.argv);
