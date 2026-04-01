const chalk = require('chalk');
const spawn = require('cross-spawn');
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const yaml = require('js-yaml');

function createProject(projectName, installPath, answers) {
    const projectDir = path.resolve(installPath);
    fs.mkdirSync(projectDir, { recursive: true });

    const templatePath = path.resolve(__dirname, '..', 'template', 'plugin');
    fs.cpSync(templatePath, projectDir, { recursive: true });

    const gitignorePath = path.join(projectDir, 'gitignore');
    if (fs.existsSync(gitignorePath)) {
        fs.renameSync(gitignorePath, path.join(projectDir, '.gitignore'));
    }

    const yamlPath = path.join(projectDir, 'codeboltplugin.yaml');
    let yamlObj = yaml.load(fs.readFileSync(yamlPath, 'utf8'));
    yamlObj.name = projectName;
    yamlObj.unique_id = answers.unique_id;
    yamlObj.description = answers.description;
    yamlObj.tags = answers.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    yamlObj.author = answers.author;
    yamlObj.version = answers.version;
    fs.writeFileSync(yamlPath, yaml.dump(yamlObj), 'utf8');

    const pkgPath = path.join(projectDir, 'package.json');
    const pkg = require(pkgPath);
    pkg.name = projectName;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

    spawn.sync('npm', ['install'], { stdio: 'inherit', cwd: installPath });

    console.log('Success! Your new plugin is ready.');
    console.log(`Created ${projectName} at ${projectDir}`);
}

const createplugin = async (options) => {
    let projectName = options.name || process.argv[3];
    const quickEnabled = options.quick || false;

    const templateYaml = yaml.load(fs.readFileSync(path.resolve(__dirname, '..', 'template/plugin', 'codeboltplugin.yaml'), 'utf8'));

    let answers;
    if (!quickEnabled) {
        answers = await inquirer.prompt([
            { type: 'input', name: 'projectName', message: 'Plugin name:', default: projectName },
            { type: 'input', name: 'unique_id', message: 'Unique ID:', default: (projectName || '').replace(/[^a-zA-Z0-9]/g, ''), validate: i => /\s/.test(i) ? 'No spaces allowed' : true },
            { type: 'input', name: 'description', message: 'Description:', default: templateYaml.description || '' },
            { type: 'input', name: 'tags', message: 'Tags (comma separated):', default: templateYaml.tags ? templateYaml.tags.join(', ') : '' },
            { type: 'input', name: 'author', message: 'Author:', default: templateYaml.author || 'codebolt' },
            { type: 'input', name: 'version', message: 'Version:', default: templateYaml.version || '1.0.0' },
        ]);
        projectName = answers.projectName.trim();
    } else {
        answers = {
            projectName, unique_id: (projectName || '').replace(/[^a-zA-Z0-9]/g, ''),
            description: templateYaml.description || '', tags: templateYaml.tags ? templateYaml.tags.join(', ') : '',
            author: templateYaml.author || '', version: templateYaml.version || '1.0.0'
        };
    }

    const installPath = path.resolve(process.cwd(), projectName);
    createProject(projectName, installPath, answers);
};

module.exports = { createplugin };
