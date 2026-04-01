const chalk = require('chalk');
const fs = require('fs');
const archiver = require('archiver');
const { createReadStream, createWriteStream } = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const yaml = require('js-yaml');
const path = require('path');
const { checkUserAuth, getUserData } = require('./userData');
const { runBuild } = require('../services/buildService');

const createZipArchive = async (sourcePath, outputPath, ignorePatterns = []) => {
    return new Promise((resolve, reject) => {
        const output = createWriteStream(outputPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.on('error', err => reject(new Error(`Archive error: ${err.message}`)));
        output.on('close', () => resolve());
        archive.pipe(output);
        archive.glob('**/*', { cwd: sourcePath, ignore: ignorePatterns });
        archive.finalize();
    });
};

const uploadFile = async (filePath, fileType, authToken) => {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('filetype', fileType);
    const response = await axios.post('https://api.codebolt.ai/api/upload/single', formData, { headers: formData.getHeaders() });
    return response.data;
};

const readConfig = async (folderPath) => {
    const configPath = path.join(folderPath, 'codeboltplugin.yaml');
    if (!fs.existsSync(configPath)) {
        throw new Error('codeboltplugin.yaml not found. Please run this command in a plugin directory.');
    }
    const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
    if (!config.name) throw new Error('name is required in codeboltplugin.yaml');
    if (!config.unique_id) throw new Error('unique_id is required in codeboltplugin.yaml');
    if (!config.description) throw new Error('description is required in codeboltplugin.yaml');
    if (!config.version) throw new Error('version is required in codeboltplugin.yaml');
    if (!config.author) throw new Error('author is required in codeboltplugin.yaml');
    return config;
};

const publishPlugin = async (targetPath) => {
    if (!checkUserAuth()) {
        console.log(chalk.red('User not authenticated. Please login first.'));
        return;
    }

    try {
        const data = getUserData();
        const authToken = data.jwtToken;

        const usernameRes = await axios.get('https://api.codebolt.ai/api/auth/check-username', { headers: { 'Authorization': `Bearer ${authToken}` } });
        const username = usernameRes.data.usersData[0].username;

        console.log(chalk.blue('Processing the Plugin....'));
        const folderPath = targetPath || '.';
        const folder = path.resolve(folderPath);
        const config = await readConfig(folderPath);
        console.log(chalk.green(`Found plugin configuration: ${config.name}`));

        try { await runBuild(folderPath); console.log(chalk.green('Build completed successfully.')); }
        catch (error) { console.log(chalk.red('Build failed:', error.message || error)); return; }

        const gitignorePath = path.join(folder, '.gitignore');
        const ignoreFiles = ['**/*.zip'];
        if (fs.existsSync(gitignorePath)) {
            ignoreFiles.push(...fs.readFileSync(gitignorePath, 'utf8').split('\n').filter(line => line && !line.startsWith('#')));
        }

        console.log(chalk.blue('Packaging distribution build...'));
        const distZipPath = `${folder}/build.zip`;
        await createZipArchive(`${folder}/dist`, distZipPath, ignoreFiles);

        console.log(chalk.blue('Packaging source code...'));
        const sourceZipPath = `${folder}/source.zip`;
        await createZipArchive(folder, sourceZipPath, ignoreFiles);

        console.log(chalk.blue('Uploading distribution build...'));
        const distResult = await uploadFile(distZipPath, 'plugin', authToken);
        console.log(chalk.blue('Uploading source code...'));
        const sourceResult = await uploadFile(sourceZipPath, 'pluginsource', authToken);
        console.log(chalk.green('Both packages uploaded successfully.'));

        try { fs.unlinkSync(distZipPath); fs.unlinkSync(sourceZipPath); } catch (err) {}

        const response = await axios.post('https://api.codebolt.ai/api/plugins/add', {
            name: config.name, unique_id: config.unique_id, description: config.description,
            tags: config.tags ? config.tags.join(', ') : '', author: config.author,
            version: config.version, zipFilePath: distResult.publicUrl,
            sourceCodeUrl: sourceResult.publicUrl, createdByUser: username
        }, { headers: { 'Authorization': `Bearer ${authToken}` } });

        console.log(chalk.green(response.data.message));
        console.log(chalk.blue(`Plugin ID: ${config.unique_id}`));
    } catch (error) {
        console.error(chalk.red('Error:'), error.message || error);
        if (error.response) console.error(chalk.red('Server response:'), error.response.data);
    }
};

module.exports = { publishPlugin };
