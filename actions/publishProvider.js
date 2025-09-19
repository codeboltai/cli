const chalk = require('chalk');
const fs = require('fs');
const archiver = require('archiver');
const { createReadStream, createWriteStream } = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const yaml = require('js-yaml');
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

// Function to read and validate provider configuration
const readProviderConfig = async (folderPath) => {
    const configPath = path.join(folderPath, 'codeboltprovider.yaml');
    
    if (!fs.existsSync(configPath)) {
        throw new Error('codeboltprovider.yaml not found. Please run this command in a provider directory.');
    }
    
    try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        const config = yaml.load(configContent);
        
        // Validate required fields
        if (!config.name) throw new Error('Provider name is required in codeboltprovider.yaml');
        if (!config.unique_id) throw new Error('unique_id is required in codeboltprovider.yaml');
        if (!config.description) throw new Error('Description is required in codeboltprovider.yaml');
        if (!config.version) throw new Error('Version is required in codeboltprovider.yaml');
        if (!config.author) throw new Error('Author is required in codeboltprovider.yaml');
        
        return config;
    } catch (err) {
        throw new Error(`Failed to parse codeboltprovider.yaml: ${err.message}`);
    }
};

const publishProvider = async (targetPath) => {
    let authToken;
    let username;

    // Check if the user is logged in
    if (!checkUserAuth()) {
        console.log(chalk.red('User not authenticated. Please login first.'));
        return;
    }
    
    try {
        const data = getUserData();
        authToken = data.jwtToken;

        // Get current user's username
        try {
            const getUsernameResponse = await axios.get(
                'https://api.codebolt.ai/api/auth/check-username',
                { headers: { 'Authorization': `Bearer ${authToken}` } }
            );
            username = getUsernameResponse.data.usersData[0].username;
        } catch (err) {
            throw new Error(`Failed to get username: ${err.message}`);
        }

        console.log(chalk.blue('Processing the Provider....'));

        const folderPath = targetPath || '.';
        const folder = path.resolve(folderPath);

        // Read and validate provider configuration
        const providerConfig = await readProviderConfig(folderPath);
        
        console.log(chalk.green(`Found provider configuration: ${providerConfig.name}`));


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
        const ignoreFiles = ['**/*.zip']; // Base ignore patterns
        
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
        const distUploadResult = await uploadFile(distZipPath, 'provider', authToken);
        const distPublicUrl = distUploadResult.publicUrl;
        
        console.log(chalk.blue('Uploading source code...'));
        const sourceUploadResult = await uploadFile(sourceZipPath, 'providerSource', authToken);
        const sourcePublicUrl = sourceUploadResult.publicUrl;
        
        console.log(chalk.green('Both packages uploaded successfully.'));
      
        // Clean up zip files
        try {
            fs.unlinkSync(distZipPath);
            fs.unlinkSync(sourceZipPath);
        } catch (err) {
            console.warn(chalk.yellow(`Warning: Could not delete temp zip files: ${err.message}`));
        }
      
        // Submit to API with both zip URLs
        const providerData = {
            name: providerConfig.name,
            unique_id: providerConfig.unique_id,
            description: providerConfig.description,
            tags: providerConfig.tags ? providerConfig.tags.join(', ') : '',
            author: providerConfig.author,
            version: providerConfig.version,
            zipFilePath: distPublicUrl,
            sourceCodeUrl: sourcePublicUrl,
            createdByUser: username
        };

        try {
            const providerResponse = await axios.post(
                'https://api.codebolt.ai/api/providers/add',
                providerData,
                {
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                }
            );

            if (providerResponse.status === 201) {
                console.log(chalk.green(providerResponse.data.message));
            } else {
                console.log(chalk.yellow(providerResponse.data.message));
            }
            
            console.log(chalk.blue(`📦 Provider ID: ${providerConfig.unique_id}`));
            console.log(chalk.blue(`📝 Description: ${providerConfig.description}`));
            console.log(chalk.blue(`🏷️  Tags: ${providerConfig.tags ? providerConfig.tags.join(', ') : 'None'}`));
            
        } catch (err) {
            throw new Error(`Failed to add provider: ${err.response?.data?.message || err.message}`);
        }

    } catch (error) {
        console.error(chalk.red('Error:'), error.message || error);
        if (error.response) {
            console.error(chalk.red('Server response:'), error.response.data);
        }
    }
};

module.exports = {
    publishProvider
}; 