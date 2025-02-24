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


const uploadFolder = async (targetPath) => {
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


        const YamlValidation = await checkYamlDetails(folderPath);
        if (!YamlValidation) {
            console.log('YAML validation failed.');
            return;
        }
        try {
            await runBuild(folderPath);
            console.log(chalk.green('Build completed successfully.'));
        } catch (error) {
            console.log(chalk.red('Build failed:', error));
            return;
        }


        const zipFilePath = `${folder}/build.zip`;
        // Create a file stream to write the zip file
        const output = createWriteStream(zipFilePath);
        const archive = archiver('zip', { zlib: { level: 9 } });

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
   
        //GET SIGNED URL

        let reqData = JSON.stringify({
            "fileextension": "zip",
            "filetype": "agent"
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://api.codebolt.ai/api/upload/single',
            headers: {
                'Content-Type': 'application/json'
            },
            data: reqData
        };

        let response = await axios.request(config)

        const { url, key } = response.data;
  
        const fileBuffer = fs.readFileSync(zipFilePath);

        let uploadConfig = {
            method: 'put',
            maxBodyLength: Infinity,
            url: url,
            headers: {
                'Content-Type': 'application/zip',
                'Content-Length': fileBuffer.length // Set the file size
            },
            data: fileBuffer, // Pass the file data
        };

        let uploadResponse = await axios.request(uploadConfig);
        // Delete the zip file after upload
        fs.unlinkSync(zipFilePath);
        // console.log(chalk.green('Zip file deleted after upload.'));

        if (uploadResponse.status === 200) {
            const getUsernameResponse = await axios.get(
                'https://api.codebolt.ai/api/auth/check-username',
                { headers: { 'Authorization': `Bearer ${authToken}` } }
            );

            const username = getUsernameResponse.data.usersData[0].username;

            const agentData = {
                ...YamlValidation,
                zipFilePath: `https://agentsdata.codebolt.ai/${key}`,
                createdByUser: username
            };


            const agentResponse = await axios.post(
                'https://api.codebolt.ai/api/agents/add',
                agentData
            );


            if (agentResponse.status === 201) {
                console.log(agentResponse.data.message);
            } else {
                console.log(agentResponse.data.message);
            }
        } else {
            console.log(`File upload failed with status code: ${uploadResponse.status}`);
        }

    } catch (error) {
        console.error('Error:', error.message || error);
    }
};




module.exports = {
    uploadFolder
};
