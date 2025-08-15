const chalk = require('chalk');
const axios = require('axios');
const spawn = require('cross-spawn');
const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const yaml = require('js-yaml');
const { v4: uuidv4 } = require('uuid');

const { checkUserAuth, getUserData } = require('./userData');

async function askForProviderDetails(parsedYaml) {
    console.log(chalk.yellow(`\n------------------------------Provider Details-----------------------------------------\n`));
    console.log(chalk.green("Provider details help configure your provider's metadata and capabilities.\n"));
    
    const providerPrompt = [
      {
        type: 'input',
        name: 'author',
        message: 'Please Enter Provider Author:',
        default: parsedYaml.author || 'codebolt',
      },
      {
        type: 'input',
        name: 'version',
        message: 'Please Enter Provider Version:',
        default: parsedYaml.version || '1.0.0',
      }
    ];

    const providerRes = await inquirer.prompt(providerPrompt);
    return {
      author: providerRes.author,
      version: providerRes.version
    };
}
  
// Removed askForInstructions function as it's not needed for providers

function createProject(projectName, installPath, selectedTemplate, answers, parsedYaml ) {
  
    const projectDir = path.resolve(installPath);
    fs.mkdirSync(projectDir, { recursive: true });
  
    // Copy the selected template to the project directory
    const templateDir = path.resolve(__dirname,'..', 'template');
    const templatePath = path.join(templateDir, selectedTemplate);
    fs.cpSync(templatePath, projectDir, { recursive: true });
  
    // Rename gitignore if it exists
    const gitignorePath = path.join(projectDir, 'gitignore');
    if (fs.existsSync(gitignorePath)) {
      fs.renameSync(gitignorePath, path.join(projectDir, '.gitignore'));
    }
  
    const providerYamlPath = path.join(projectDir, 'codeboltprovider.yaml');
    let providerYaml = fs.readFileSync(providerYamlPath, 'utf8');
    
    let providerYamlObj = yaml.load(providerYaml);
    providerYamlObj.name = projectName;
    providerYamlObj.unique_id = answers.unique_id;
    providerYamlObj.description = answers.providerDescription;
    providerYamlObj.tags = answers.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    providerYamlObj.author = answers.providerDetails.author;
    providerYamlObj.version = answers.providerDetails.version;
    
    providerYaml = yaml.dump(providerYamlObj);
  
    fs.writeFileSync(providerYamlPath, providerYaml, 'utf8');
  
    const projectPackageJson = require(path.join(projectDir, 'package.json'));
  
    // Update the project's package.json with the new project name
    projectPackageJson.name = projectName;
  
    fs.writeFileSync(
      path.join(projectDir, 'package.json'),
      JSON.stringify(projectPackageJson, null, 2)
    );
  
    // Run `npm install` in the project directory to install
    // the dependencies. We are using a third-party library
    // called `cross-spawn` for cross-platform support.
    // (Node has issues spawning child processes in Windows).
    spawn.sync('npm', ['install'], { stdio: 'inherit', cwd: installPath });
  
    // spawn.sync('git', ['init'], { stdio: 'inherit', cwd: installPath });
  
    console.log('Success! Your new provider is ready.');
    console.log(`Created ${projectName} at ${projectDir}`);
}

async function getBasicAnswers(projectName, quickEnabled, parsedYaml){
    
    const prompts = [];
    let answers = [];


    if (!quickEnabled) {
        prompts.push({
            type: 'input',
            name: 'projectName',
            message: 'Please Enter the name of your Provider:',
            default: projectName,
        });

        prompts.push({
            type: 'input',
            name: 'unique_id',
            message: 'Please enter the unique_id:',
            default: projectName.replace(/[^a-zA-Z0-9]/g, ''),
            validate: function (input) {
                if (/\s/.test(input)) {
                    return 'unique_id should not contain any spaces';
                }
                return true;
            }
        });
    
        prompts.push({
            type: 'input',
            name: 'providerDescription',
            message: 'Please enter a description for your provider:',
            default: parsedYaml.description || '',
        });
    
        prompts.push({
            type: 'input',
            name: 'tags',
            message: 'Please Enter provider tags by comma separated:',
            default: parsedYaml.tags ? parsedYaml.tags.join(', ') : '',
        });

        answers = await inquirer.prompt(prompts);
    }
    else {
        answers.projectName = projectName;
        answers.unique_id = projectName.replace(/[^a-zA-Z0-9]/g, '')
        answers.providerDescription = parsedYaml.description || ''
        answers.tags = parsedYaml.tags ? parsedYaml.tags.join(', ') : ''
    }

   
    return answers;
}

const createprovider = async (options) => {
    console.log(chalk.blue(
        "  _____           _      _           _ _    \n"+
        " /  __ \\         | |    | |         | | |   \n"+
        " | /  \\/ ___   __| | ___| |__   ___ | | |_  \n"+
        " | |    / _ \\ / _` |/ _ \\ '_ \\ / _ \\| | __| \n"+
        " | \\__/\\ (_) | (_| |  __/ |_) | (_) | | |_  \n"+
        "  \\____/\\___/ \\__,_|\\___|_.__/ \\___/|_|\\__| \n"));

    let projectName = options.name || process.argv[3];
    const quickEnabled = options.quick || false;

    const providerymlpath = path.join(__dirname, '..','template/provider', 'codeboltprovider.yaml');
    let providerYamlData = fs.readFileSync(providerymlpath, 'utf8');
    const parsedYaml = yaml.load(providerYamlData);
    const answers = await getBasicAnswers(projectName, quickEnabled, parsedYaml)
    projectName = answers.projectName.trim();
    answers.providerDetails = !quickEnabled ? await askForProviderDetails(parsedYaml) : { author: parsedYaml.author || '', version: parsedYaml.version || '1.0.0' };
    
    const installPath = path.resolve(process.cwd(), projectName);
    const selectedTemplate = 'provider';
    
    createProject(projectName, installPath, selectedTemplate, answers, parsedYaml);
};


module.exports = { createprovider };
