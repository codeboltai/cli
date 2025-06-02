const chalk = require('chalk');
const axios = require('axios');
const { checkUserAuth, getUserData } = require('./userData');

// MCP API endpoints - adjust these based on your actual API base URL
const MCP_API_BASE = 'https://api.codebolt.ai'; // Update this to your actual MCP API base URL

const listTools = async () => {
    // Check if the user is logged in
    if (!checkUserAuth()) {
        console.log(chalk.red('User not authenticated. Please login first.'));
        return;
    }
    
    try {
        const data = getUserData();
        const authToken = data.jwtToken;

        // Get current user's username
        let username;
        try {
            const getUsernameResponse = await axios.get(
                `${MCP_API_BASE}/api/auth/check-username`,
                { headers: { 'Authorization': `Bearer ${authToken}` } }
            );
            username = getUsernameResponse.data.usersData[0].username;
        } catch (err) {
            throw new Error(`Failed to get username: ${err.message}`);
        }

        console.log(chalk.blue('📦 Fetching your published MCP tools...\n'));

        // Fetch user's MCP tools
        try {
            const response = await axios.get(
                `${MCP_API_BASE}/mcp/myMcp/${username}`,
                {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'x-codebolt-userId': data.userId
                    }
                }
            );

            const tools = response.data.data || [];

            if (tools.length === 0) {
                console.log(chalk.yellow('📭 No MCP tools found. Use "codebolt-cli publishtool" to publish your first tool!'));
                return;
            }

            console.log(chalk.green(`✅ Found ${tools.length} published MCP tool(s):\n`));

            // Display tools in a formatted way
            tools.forEach((tool, index) => {
                console.log(chalk.cyan(`${index + 1}. ${tool.name}`));
                console.log(chalk.gray(`   ID: ${tool.mcpId}`));
                console.log(chalk.gray(`   Description: ${tool.description || 'No description'}`));
                
                if (tool.category) {
                    console.log(chalk.gray(`   Category: ${tool.category}`));
                }
                
                if (tool.tags) {
                    console.log(chalk.gray(`   Tags: ${tool.tags}`));
                }
                
                if (tool.githubUrl) {
                    console.log(chalk.gray(`   GitHub: ${tool.githubUrl}`));
                }
                
                if (tool.githubStars) {
                    console.log(chalk.gray(`   ⭐ Stars: ${tool.githubStars}`));
                }
                
                if (tool.requiresApiKey) {
                    console.log(chalk.gray(`   🔑 Requires API Key: Yes`));
                }
                
                console.log(chalk.gray(`   📅 Updated: ${new Date(tool.updatedAt).toLocaleDateString()}`));
                console.log(); // Empty line for spacing
            });

            console.log(chalk.blue(`💡 Use "codebolt-cli publishtool <folder>" to update an existing tool or publish a new one.`));

        } catch (err) {
            if (err.response && err.response.status === 404) {
                console.log(chalk.yellow('📭 No MCP tools found. Use "codebolt-cli publishtool" to publish your first tool!'));
                return;
            }
            throw new Error(`Failed to fetch MCP tools: ${err.response?.data?.error || err.message}`);
        }

    } catch (error) {
        console.error(chalk.red('❌ Error fetching tools:'), error.message);
        process.exit(1);
    }
};

module.exports = { listTools }; 