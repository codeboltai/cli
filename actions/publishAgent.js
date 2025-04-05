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

        const zipFilePath = `${folder}/build.zip`;
        // Create a file stream to write the zip file
        const output = createWriteStream(zipFilePath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        // Set up archive error handling
        archive.on('error', (err) => {
            throw new Error(`Archive error: ${err.message}`);
        });

        // Pipe archive data to the file
        archive.pipe(output);

        // Read .gitignore file and add its contents to the archiver's ignore list
        const gitignorePath = path.join(folder, '.gitignore');
        const ignoreFiles = ['node_modules/**/*', '**/*.zip']; // Ignore node_modules and zip files
        if (fs.existsSync(gitignorePath)) {
            const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
            ignoreFiles.push(...gitignoreContent.split('\n').filter(line => line && !line.startsWith('#')));
        }

        console.log(chalk.blue('Packaging in progress please wait...'));
        
        // Add files to the archive while respecting .gitignore
        archive.glob('**/*', {
            cwd: `${folder}/dist`,
            ignore: ignoreFiles
        });

        // Finalize the archive
        await new Promise((resolve, reject) => {
            output.on('close', resolve);
            archive.on('error', reject);
            archive.finalize();
        });

        console.log(chalk.green('Packaging Done.'));
        // Handle the upload
        console.log(chalk.blue('Publishing Package...'));
   
        //Create form data for upload
        const formData = new FormData();
        formData.append('file', fs.createReadStream(zipFilePath));
        formData.append('filetype', 'agent');
      
        let response;
        try {
            response = await axios.post(
                'https://api.codebolt.ai/api/upload/single',
                formData,
                {
                headers: formData.getHeaders(), // this sets the correct Content-Type boundary
                }
            );
        } catch (err) {
            throw new Error(`Failed to upload package: ${err.message}`);
        }
      
        const { key, publicUrl } = response.data;
  
        // Delete the zip file after upload
        try {
            fs.unlinkSync(zipFilePath);
            // console.log(chalk.green('Zip file deleted after upload.'));
        } catch (err) {
            console.warn(chalk.yellow(`Warning: Could not delete temp zip file: ${err.message}`));
            // Continue even if we can't delete the zip file
        }
      
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

        const agentData = {
            ...YamlValidation,
            zipFilePath: publicUrl,
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