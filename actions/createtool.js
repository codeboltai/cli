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


function createProject( installPath, answers ) {
  
    const projectDir = path.resolve(installPath);
    fs.mkdirSync(projectDir, { recursive: true });

  
    // Copy the selected template to the project directory
    const templateDir = path.resolve(__dirname,'..', 'template', 'tool');
    fs.cpSync(templateDir, projectDir, { recursive: true });

  
    // Fixing Tool Yaml
    const toolYamlPath = path.join(projectDir, 'codebolttool.yaml');
    let toolYaml = fs.readFileSync(toolYamlPath, 'utf8');
    const parsedtoolYaml = yaml.load(toolYaml);
    parsedtoolYaml.name = answers.toolName;
    parsedtoolYaml.description = answers.toolDescription;
    parsedtoolYaml.version = "1.0.0";
    parsedtoolYaml.uniqueName = answers.unique_id
    toolYaml = yaml.dump(parsedtoolYaml);
    fs.writeFileSync(toolYamlPath, toolYaml, 'utf8');

    //Updating the index.js
    const indexjspath = path.join(projectDir, 'index.js');
    let indexjsData = fs.readFileSync(indexjspath, 'utf8');
    indexjsData = indexjsData.replace(/MyTool/g, answers.unique_id);
    fs.writeFileSync(indexjspath, indexjsData, 'utf8');
  

    // Update the project's package.json with the new project name
    const projectPackageJson = require(path.join(projectDir, 'package.json'));
    projectPackageJson.name = answers.unique_id;
    fs.writeFileSync( path.join(projectDir, 'package.json'), JSON.stringify(projectPackageJson, null, 2) );
  
    
    console.log('Success! Your new Tool is ready.');
    console.log(`Created ${answers.unique_id} at ${projectDir}`);
}

async function getBasicAnswers(toolName){
    
    const prompts = [];
    const answers = [];
    const currentPath = process.cwd();

    prompts.push({
        type: 'input',
        name: 'toolName',
        message: 'Please Enter the name of your Tool: (Accept Spaces, Only for Display)',
        default: toolName,
    });

    prompts.push({
        type: 'input',
        name: 'unique_id',
        message: 'Please enter the Unique Id without spaces: ',
        default: toolName.replace(/[^a-zA-Z0-9]/g, ''),
        validate: function (input) {
            if (/\s/.test(input)) {
                return 'unique_id should not contain any spaces';
            }
            return true;
        }
    });

    prompts.push({
        type: 'input',
        name: 'toolDescription',
        message: 'Please enter a description for your Tool:',
        default: 'Description of the tool',
    });

    answers = await inquirer.prompt(prompts);
    return answers;
}

const createtool = async (options) => {
    console.log(chalk.blue(
        "  _____           _      _           _ _    \n"+
        " /  __ \\         | |    | |         | | |   \n"+
        " | /  \\/ ___   __| | ___| |__   ___ | | |_  \n"+
        " | |    / _ \\ / _` |/ _ \\ '_ \\ / _ \\| | __| \n"+
        " | \\__/\\ (_) | (_| |  __/ |_) | (_) | | |_  \n"+
        "  \\____/\\___/ \\__,_|\\___|_.__/ \\___/|_|\\__| \n"));

    let toolName = options.name || process.argv[3] || "";

    const answers = await getBasicAnswers(toolName);
    toolName = answers.toolName.trim();

    const currentDir = process.cwd();
    const codeboltAgentsPath = path.join(currentDir, '.codeboltAgents');
    let installPath;

    if (fs.existsSync(codeboltAgentsPath)) {
        installPath = path.join(codeboltAgentsPath, 'tools', answers.unique_id);
    } else {
        const { createFolder } = await inquirer.prompt({
            type: 'confirm',
            name: 'createFolder',
            message: 'The .codeboltAgents folder does not exist in the current directory. Do you want to create it here?',
            default: false,
        });

        if (createFolder) {
            fs.mkdirSync(codeboltAgentsPath, { recursive: true });
            installPath = path.join(codeboltAgentsPath, 'tools', answers.unique_id);
        } else {
            console.log('Exiting...');
            process.exit(1);
        }
    }

    createProject(installPath, answers);
};


module.exports = { createtool };