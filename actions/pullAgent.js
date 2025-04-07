const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const yaml = require('js-yaml');
const inquirer = require('inquirer');
const { checkUserAuth, getUserData } = require('./userData');
const { checkYamlDetails } = require('../services/yamlService');

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

const pullAgent = async (workingDir) => {
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
        const yamlPath = path.join(fullPath, 'codeboltagent.yaml');

        // Check if the YAML file exists in the current directory
        if (!fs.existsSync(yamlPath)) {
            console.log(chalk.red('codeboltagent.yaml not found in the specified directory.'));
            return;
        }

        // Read the current YAML file to get the unique_id
        console.log(chalk.blue('Reading current agent configuration...'));
        let yamlContent;
        try {
            const fileContent = fs.readFileSync(yamlPath, 'utf8');
            yamlContent = yaml.load(fileContent);
        } catch (error) {
            console.log(chalk.red('Error reading YAML file:', error.message));
            return;
        }

        if (!yamlContent || !yamlContent.unique_id) {
            console.log(chalk.red('Invalid YAML file or missing unique_id.'));
            return;
        }

        const uniqueId = yamlContent.unique_id;
        console.log(chalk.blue(`Fetching latest configuration for agent: ${uniqueId}`));

        // Fetch the latest configuration from the server
        let latestConfig;
        try {
            const response = await axios.get(
                `https://api.codebolt.ai/api/agents/detailbyuid?unique_id=${uniqueId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                }
            );
            
            latestConfig = response.data;
            
            if (!latestConfig) {
                console.log(chalk.red('Failed to fetch agent configuration or agent not found.'));
                return;
            }
        } catch (error) {
            console.log(chalk.red('Error fetching agent configuration:', 
                error.response?.data?.message || error.message));
            return;
        }

        // Check versions
        const localVersion = yamlContent.version || '0.0.0';
        const serverVersion = latestConfig.version || '0.0.0';
        const versionComparison = compareVersions(serverVersion, localVersion);
        
        // Check if server version is lower than local version
        if (versionComparison < 0) {
            console.log(chalk.yellow(`Warning: Server version (${serverVersion}) is lower than local version (${localVersion}).`));
            
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
            console.log(chalk.blue(`Server and local versions match (${serverVersion}).`));
        } else {
            console.log(chalk.green(`Server version (${serverVersion}) is newer than local version (${localVersion}).`));
        }

        // Convert API response to YAML format
        console.log(chalk.blue('Updating local configuration...'));
        
        // Fields to exclude from the server response
        const excludeFields = [
            'createdByUser',
            'agent_id',
            'zipFilePath',
            'slug',
            'status',
            'updatedAt',
            'id',
            'createdAt',
            'lastUpdatedUI'
        ];
        
        // Create a clean config object without the excluded fields
        const cleanConfig = {};
        for (const key in latestConfig) {
            if (!excludeFields.includes(key)) {
                cleanConfig[key] = latestConfig[key];
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
            console.log(chalk.green('Agent configuration successfully updated!'));

            // Notify server that CLI has acknowledged the update
            try {
                await axios.put(
                    `https://api.codebolt.ai/api/agents/uiupdateacknowledgedbycli?unique_id=${uniqueId}`,
                    {},
                    {
                        headers: {
                            'Authorization': `Bearer ${authToken}`
                        }
                    }
                );
                console.log(chalk.green('Server notified of successful update.'));
            } catch (error) {
                console.log(chalk.yellow('Warning: Could not notify server of update:', 
                    error.response?.data?.message || error.message));
                // Don't return here as the local update was successful
            }
        } catch (error) {
            console.log(chalk.red('Error updating YAML file:', error.message));
            return;
        }
    } catch (error) {
        console.error(chalk.red('Error:'), error.message);
        if (error.response) {
            console.error(chalk.red('Server response:'), error.response.data);
        }
    }
};

module.exports = {
    pullAgent
}; 