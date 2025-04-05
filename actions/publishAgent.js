const chalk = require('chalk');
const fs = require('fs');
const archiver = require('archiver');
const { createReadStream, createWriteStream } = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const AdmZip = require('adm-zip');
const yaml = require('js-yaml');
const StreamZip = require('node-stream-zip');
const path = require('path');
const { checkUserAuth, getUserData } = require('./userData');
const { checkYamlDetails } = require('../services/yamlService');
const { runBuild } = require('../services/buildService');

// Function to create a zip archive
const createZipArchive = async (sourcePath, outputPath, ignorePatterns = []) => {
    return new Promise((resolve, reject) => {
        const output = createWriteStream(outputPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        archive.on('error', err => reject(new Error(`Archive error: ${err.message}`)));
        
        output.on('close', () => resolve());
        
        archive.pipe(output);
        
        archive.glob('**/*', {
            cwd: sourcePath,
            ignore: ignorePatterns
        });
        
        archive.finalize();
    });
};

// Function to upload file and get URL
const uploadFile = async (filePath, fileType, authToken) => {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('filetype', fileType);
    
    try {
        const response = await axios.post(
            'https://api.codebolt.ai/api/upload/single',
            formData,
            {
                headers: formData.getHeaders()
            }
        );
        return response.data;
    } catch (err) {
        throw new Error(`Failed to upload ${fileType}: ${err.message}`);
    }
};

const publishAgent = async (targetPath) => {
    let authToken;

    // Check if the user is logged in
    if (!checkUserAuth()) {
        console.log(chalk.red('User not authenticated. Please login first.'));
        return;
    }
    
    try {
        const data = getUserData();
        authToken = data.jwtToken;

        console.log(chalk.blue('Processing the Code....'));

        const folderPath = targetPath || '.';
        const folder = path.resolve(folderPath);

        // Validate YAML file
        const YamlValidation = await checkYamlDetails(folderPath);
        if (!YamlValidation) {
            console.log(chalk.red('YAML validation failed.'));
            return;
        }

        // Run build
        try {
            await runBuild(folderPath);
            console.log(chalk.green('Build completed successfully.'));
        } catch (error) {
            console.log(chalk.red('Build failed:', error.message || error));
            return;
        }

        // Read .gitignore file and add its contents to the ignore list
        const gitignorePath = path.join(folder, '.gitignore');
        const ignoreFiles = ['node_modules/**/*', '**/*.zip']; // Base ignore patterns
        
        if (fs.existsSync(gitignorePath)) {
            const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
            ignoreFiles.push(...gitignoreContent.split('\n').filter(line => line && !line.startsWith('#')));
        }

        // Create dist build zip
        console.log(chalk.blue('Packaging distribution build...'));
        const distZipPath = `${folder}/build.zip`;
        
        await createZipArchive(`${folder}/dist`, distZipPath, ignoreFiles);
        console.log(chalk.green('Distribution build packaging done.'));
        
        // Create source code zip
        console.log(chalk.blue('Packaging source code...'));
        const sourceZipPath = `${folder}/source.zip`;
        
        await createZipArchive(folder, sourceZipPath, ignoreFiles);
        console.log(chalk.green('Source code packaging done.'));

        // Upload both zip files
        console.log(chalk.blue('Uploading distribution build...'));
        const distUploadResult = await uploadFile(distZipPath, 'agent', authToken);
        const distPublicUrl = distUploadResult.publicUrl;
        
        console.log(chalk.blue('Uploading source code...'));
        const sourceUploadResult = await uploadFile(sourceZipPath, 'agentsource', authToken);
        const sourcePublicUrl = sourceUploadResult.publicUrl;
        
        console.log(chalk.green('Both packages uploaded successfully.'));
      
        // Clean up zip files
        try {
            fs.unlinkSync(distZipPath);
            fs.unlinkSync(sourceZipPath);
        } catch (err) {
            console.warn(chalk.yellow(`Warning: Could not delete temp zip files: ${err.message}`));
        }
      
        // Get username
        let username;
        try {
            const getUsernameResponse = await axios.get(
                'https://api.codebolt.ai/api/auth/check-username',
                { headers: { 'Authorization': `Bearer ${authToken}` } }
            );

            username = getUsernameResponse.data.usersData[0].username;
        } catch (err) {
            throw new Error(`Failed to get username: ${err.message}`);
        }

        // Submit to API with both zip URLs
        const agentData = {
            ...YamlValidation,
            zipFilePath: distPublicUrl,
            sourceCodeUrl: sourcePublicUrl,
            createdByUser: username
        };

        try {
            const agentResponse = await axios.post(
                'https://api.codebolt.ai/api/agents/add',
                agentData,
                {
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                }
            );

            if (agentResponse.status === 201) {
                console.log(chalk.green(agentResponse.data.message));
            } else {
                console.log(chalk.yellow(agentResponse.data.message));
            }
        } catch (err) {
            throw new Error(`Failed to add agent: ${err.response?.data?.message || err.message}`);
        }

    } catch (error) {
        console.error(chalk.red('Error:'), error.message || error);
        if (error.response) {
            console.error(chalk.red('Server response:'), error.response.data);
        }
    }
};

module.exports = {
    publishAgent
}; 