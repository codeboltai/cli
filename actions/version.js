const chalk = require('chalk');
const { program } = require('commander');
const getVersion = async () => {
    console.log(chalk.green(`Version: ${program.version()}`));
  };

module.exports = { getVersion };
