const chalk = require('chalk');
const fs = require('fs');
const archiver = require('archiver');
const { createReadStream, createWriteStream } = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const yaml = require('js-yaml');
const path = require('path');
const inquirer = require('inquirer');
const { checkUserAuth, getUserData } = require('./userData');

// MCP API endpoints - adjust these based on your actual API base URL
const MCP_API_BASE = 'https://api.codebolt.ai'; // Update this to your actual MCP API base URL

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
            `${MCP_API_BASE}/api/upload/single`,
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

// Function to read and validate tool configuration
const readToolConfig = async (folderPath) => {
    const configPath = path.join(folderPath, 'codebolttool.yaml');
    
    if (!fs.existsSync(configPath)) {
        throw new Error('codebolttool.yaml not found. Please run this command in a tool directory.');
    }
    
    try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        const config = yaml.load(configContent);
        
        // Validate required fields
        if (!config.name) throw new Error('Tool name is required in codebolttool.yaml');
        if (!config.uniqueName) throw new Error('uniqueName is required in codebolttool.yaml');
        if (!config.description) throw new Error('Description is required in codebolttool.yaml');
        
        return config;
    } catch (err) {
        throw new Error(`Failed to parse codebolttool.yaml: ${err.message}`);
    }
};

// Function to check if MCP tool exists
const checkMcpExists = async (mcpId, authToken) => {
    try {
        const response = await axios.get(
            `${MCP_API_BASE}/mcp/detailbyuid/${mcpId}`,
            {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            }
        );
        return response.data;
    } catch (err) {
        if (err.response && err.response.status === 404) {
            return null; // MCP doesn't exist
        }
        throw new Error(`Failed to check MCP existence: ${err.message}`);
    }
};

// Function to get GitHub repo information
const extractGithubInfo = async (githubUrl) => {
    if (!githubUrl) return {};
    
    try {
        // Extract repo info from GitHub URL
        const repoMatch = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!repoMatch) return {};
        
        const [, owner, repo] = repoMatch;
        
        // Get GitHub stars and other info
        const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`);
        
        return {
            githubStars: response.data.stargazers_count || 0,
            avatarSrc: response.data.owner.avatar_url,
            readmeUrl: `https://raw.githubusercontent.com/${owner}/${repo}/main/README.md`
        };
    } catch (err) {
        console.warn(chalk.yellow(`Warning: Could not fetch GitHub info: ${err.message}`));
        return {};
    }
};

// Function to read README content
const readReadmeContent = (folderPath) => {
    const readmePath = path.join(folderPath, 'README.md');
    if (fs.existsSync(readmePath)) {
        return fs.readFileSync(readmePath, 'utf8');
    }
    return '';
};

// Function to create or update MCP tool
const createOrUpdateMcp = async (mcpData, authToken, isUpdate = false) => {
    const endpoint = `${MCP_API_BASE}/mcp/add`;
    
    try {
        const response = await axios.post(endpoint, mcpData, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
                'x-codebolt-userId': getUserData().userId
            }
        });
        
        return response.data;
    } catch (err) {
        throw new Error(`${err.response?.data?.error || err.message}`);
    }
};

const publishTool = async (targetPath) => {
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
                `${MCP_API_BASE}/api/auth/check-username`,
                { headers: { 'Authorization': `Bearer ${authToken}` } }
            );
            username = getUsernameResponse.data.usersData[0].username;
        } catch (err) {
            throw new Error(`Failed to get username: ${err.message}`);
        }

        console.log(chalk.blue('Processing the MCP Tool....'));

        const folderPath = targetPath || '.';
        const folder = path.resolve(folderPath);

        // Read and validate tool configuration
        const toolConfig = await readToolConfig(folderPath);
        console.log(chalk.green(`Found tool configuration: ${toolConfig.name}`));

        // Check if MCP tool already exists
        let existingMcp = null;
        let isUpdate = false;
        
        try {
            existingMcp = await checkMcpExists(toolConfig.uniqueName, authToken);

             // Check if  was tool updated from UI
             if (existingMcp.data.lastUpdatedUI) {
                console.log(chalk.yellow('This tool has been updated from the UI.'));
                console.log(chalk.yellow('Please run "npx codebolt-cli pulltool <file path> or npx codebolt-cli pulltools ." to update your local configuration first.'));
                return;
            }

            // Check if current user is the creator
            if (existingMcp.data.createByUser !== username) {
                console.log(chalk.red('You are not authorized to update this tool.'));
                console.log(chalk.yellow('Please update the unique_id in your codebolttool.yaml file to create a new tool.'));
                return;
            }
        } catch (err) {
            console.warn(chalk.yellow(`Warning: Could not check existing MCP: ${err.message}`));
        }

        // Prompt for additional information if creating new MCP
        let additionalInfo = {};
        if (!isUpdate) {
            const prompts = [
                {
                    type: 'input',
                    name: 'githubUrl',
                    message: 'GitHub repository URL (optional):',
                    default: ''
                },
                {
                    type: 'input',
                    name: 'category',
                    message: 'Category for your MCP tool (optional):',
                    default: ''
                },
                {
                    type: 'input',
                    name: 'tags',
                    message: 'Tags (comma-separated):',
                    default: ''
                },
                {
                    type: 'confirm',
                    name: 'requiresApiKey',
                    message: 'Does this tool require an API key?',
                    default: false
                }
            ];

            additionalInfo = await inquirer.prompt(prompts);
        }

        // Get GitHub information if URL provided
        let githubInfo = {};
        if (additionalInfo.githubUrl) {
            console.log(chalk.blue('Fetching GitHub information...'));
            githubInfo = await extractGithubInfo(additionalInfo.githubUrl);
        }

        // Read README content
        const readmeContent = readReadmeContent(folderPath);

        // Read .gitignore file and add its contents to the ignore list
        const gitignorePath = path.join(folder, '.gitignore');
        const ignoreFiles = ['node_modules/**/*', '**/*.zip', 'dist/**/*']; // Base ignore patterns
        
        if (fs.existsSync(gitignorePath)) {
            const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
            ignoreFiles.push(...gitignoreContent.split('\n').filter(line => line && !line.startsWith('#')));
        }

        // Create source code zip
        console.log(chalk.blue('Packaging source code...'));
        const sourceZipPath = `${folder}/${toolConfig.uniqueName}.zip`;
        
        await createZipArchive(folder, sourceZipPath, ignoreFiles);
        console.log(chalk.green('Source code packaging done.'));

        // Upload source code zip
        console.log(chalk.blue('Uploading source code...'));
        const sourceUploadResult = await uploadFile(sourceZipPath, 'mcp', authToken);
        const sourcePublicUrl = sourceUploadResult.publicUrl;
        
        console.log(chalk.green('Source code uploaded successfully.'));
      
        // Clean up zip file
        try {
            fs.unlinkSync(sourceZipPath);
        } catch (err) {
            console.warn(chalk.yellow(`Warning: Could not delete temp zip file: ${err.message}`));
        }
      
        // Prepare MCP data according to database schema
        const currentTimestamp = new Date().toISOString();
        const mcpData = {
            mcpId: toolConfig.uniqueName,
            name: toolConfig.name,
            description: toolConfig.description,
            author: username,
            readmeContent: readmeContent,
            sourceCodeUrl: sourcePublicUrl,
            version: toolConfig.version,
            createdAt: isUpdate ? undefined : currentTimestamp, // Only set on creation
            updatedAt: currentTimestamp,
            lastGithubSync: currentTimestamp,
            status: true, // Default to active
            isDisabled: false,
            isVerified: false,
            isInvalid: false,
            isPrivate: false,
            isExternal: false,
            ...(additionalInfo.githubUrl && { githubUrl: additionalInfo.githubUrl }),
            ...(additionalInfo.category && { category: additionalInfo.category }),
            ...(additionalInfo.tags && { tags: additionalInfo.tags }),
            ...(typeof additionalInfo.requiresApiKey !== 'undefined' && { requiresApiKey: additionalInfo.requiresApiKey }),
            ...githubInfo
        };

        // Add installation content for LLMs
        if (toolConfig.parameters) {
            mcpData.llmsInstallationContent = JSON.stringify({
                name: toolConfig.name,
                description: toolConfig.description,
                parameters: toolConfig.parameters
            });
        }

        // Submit to API
        try {
          
            const result = await createOrUpdateMcp(mcpData, authToken, isUpdate);
            
            if (isUpdate) {
                console.log(chalk.green(`✅ MCP tool "${toolConfig.name}" updated successfully!`));
            } else {
                console.log(chalk.green(`✅ MCP tool "${toolConfig.name}" published successfully!`));
            }
            
            console.log(chalk.blue(`📦 Tool ID: ${toolConfig.uniqueName}`));
            console.log(chalk.blue(`📝 Description: ${toolConfig.description}`));
            
        } catch (err) {
            throw new Error(`Failed to ${isUpdate ? 'update' : 'publish'} MCP tool: ${err.message}`);
        }

    } catch (error) {
        console.error(chalk.red('❌ Error publishing tool:'), error.message);
        process.exit(1);
    }
};

module.exports = { publishTool }; 