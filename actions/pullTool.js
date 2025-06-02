const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const yaml = require('js-yaml');
const inquirer = require('inquirer');
const { checkUserAuth, getUserData } = require('./userData');

// MCP API endpoints
const MCP_API_BASE = 'https://api.codebolt.ai';

// Compare version numbers
const compareVersions = (version1, version2) => {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
        const v1Part = v1Parts[i] || 0;
        const v2Part = v2Parts[i] || 0;
        
        if (v1Part > v2Part) return 1;
        if (v1Part < v2Part) return -1;
    }
    
    return 0; // Versions are equal
};

const pullTool = async (workingDir) => {
    // Check if the user is logged in
    if (!checkUserAuth()) {
        console.log(chalk.red('User not authenticated. Please login first.'));
        return;
    }

    try {
        const userData = getUserData();
        const authToken = userData.jwtToken;
        
        const folderPath = workingDir || '.';
        const fullPath = path.resolve(folderPath);
        const yamlPath = path.join(fullPath, 'codebolttool.yaml');

        // Check if the YAML file exists in the current directory
        if (!fs.existsSync(yamlPath)) {
            console.log(chalk.red('codebolttool.yaml not found in the specified directory.'));
            console.log(chalk.blue('Please run this command in a directory with an MCP tool configuration.'));
            return;
        }

        // Read the current YAML file to get the uniqueName
        console.log(chalk.blue('📖 Reading current tool configuration...'));
        let yamlContent;
        try {
            const fileContent = fs.readFileSync(yamlPath, 'utf8');
            yamlContent = yaml.load(fileContent);
        } catch (error) {
            console.log(chalk.red('Error reading YAML file:', error.message));
            return;
        }

        if (!yamlContent || !yamlContent.uniqueName) {
            console.log(chalk.red('Invalid YAML file or missing uniqueName field.'));
            return;
        }

        const uniqueName = yamlContent.uniqueName;
        console.log(chalk.blue(`🔍 Fetching latest configuration for MCP tool: ${uniqueName}`));


        // Fetch the latest configuration from the server
        let latestConfig;
        try {
            const response = await axios.get(
                `${MCP_API_BASE}/mcp/detailbyuid/${uniqueName}`,
                {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'x-codebolt-userId': userData.userId
                    }
                }
            );
            
            latestConfig = response.data.data;
            
            if (!latestConfig) {
                console.log(chalk.red('Failed to fetch tool configuration or tool not found.'));
                return;
            }
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log(chalk.red('MCP tool not found on server. Make sure it has been published first.'));
                return;
            }
            console.log(chalk.red('Error fetching tool configuration:', 
                error.response?.data?.error || error.message));
            return;
        }

        // Check versions
        const localVersion = yamlContent.version || '1.0.0';
        const serverVersion = latestConfig.version || '1.0.0';
        const versionComparison = compareVersions(serverVersion, localVersion);
        
        // Check if server version is lower than local version
        if (versionComparison < 0) {
            console.log(chalk.yellow(`⚠️  Warning: Server version (${serverVersion}) is lower than local version (${localVersion}).`));
            
            // Ask for confirmation
            const answer = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'proceed',
                    message: 'The server version is lower than your local version. Do you still want to update your configuration?',
                    default: false
                }
            ]);
            
            if (!answer.proceed) {
                console.log(chalk.blue('Update cancelled.'));
                return;
            }
            
            console.log(chalk.blue('Proceeding with update as requested...'));
        } else if (versionComparison === 0) {
            console.log(chalk.blue(`📊 Server and local versions match (${serverVersion}).`));
        } else {
            console.log(chalk.green(`🆙 Server version (${serverVersion}) is newer than local version (${localVersion}).`));
        }

        // Convert API response to YAML format
        console.log(chalk.blue('🔄 Updating local configuration...'));
        
        // Fields to exclude from the server response (database-specific fields)
        const excludeFields = [
            'id',
            'author',
            'createdAt',
            'updatedAt',
            'lastGithubSync',
            'status',
            'isDisabled',
            'isVerified',
            'isInvalid',
            'isPrivate',
            'isExternal',
            'createByUser',
            'sourceCodeUrl',
            'githubStars',
            'avatarSrc',
            'readmeUrl',
        ];
        
        // Create a clean config object without the excluded fields
        const cleanConfig = {};
        for (const key in latestConfig) {
            if (!excludeFields.includes(key)) {
                // Map database field names to YAML field names
                let yamlKey = key;
                if (key === 'mcpId') {
                    yamlKey = 'uniqueName';
                }
                cleanConfig[yamlKey] = latestConfig[key];
            }
        }
        
        // Keep original file structure but update with new values
        const updatedYaml = {
            ...yamlContent, // Keep original structure
            ...cleanConfig, // Overwrite with filtered fetched configuration
        };

        // Write the updated YAML back to the file
        try {
            const updatedYamlString = yaml.dump(updatedYaml, {
                lineWidth: -1, // Prevent line wrapping
                noRefs: true,  // Avoid YAML references
            });
            
            fs.writeFileSync(yamlPath, updatedYamlString, 'utf8');
            console.log(chalk.green('✅ Tool configuration successfully updated!'));
            
            // Show what was updated
            console.log(chalk.blue('\n📋 Updated fields:'));
            Object.keys(cleanConfig).forEach(key => {
                if (yamlContent[key] !== cleanConfig[key]) {
                    console.log(chalk.gray(`   ${key}: ${yamlContent[key]} → ${cleanConfig[key]}`));
                }
            });

            // Note: Unlike agents, MCP tools don't have a specific "UI update acknowledgment" endpoint
            // so we don't need to notify the server
            
        } catch (error) {
            console.log(chalk.red('Error updating YAML file:', error.message));
            return;
        }
    } catch (error) {
        console.error(chalk.red('❌ Error:'), error.message);
        if (error.response) {
            console.error(chalk.red('Server response:'), error.response.data);
        }
    }
};

module.exports = {
    pullTool
}; 