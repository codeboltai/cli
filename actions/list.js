const chalk = require('chalk');
const axios = require('axios');

const { checkUserAuth, getUserData } = require('./userData');

const list = async () => {
    if (!checkUserAuth()) {
        console.log(chalk.red('User not authenticated. Please login first.'));
        return;
    }

    const userData = getUserData();

    if (!userData || !userData.jwtToken) {
        console.log(chalk.red('Failed to retrieve user data or authentication token.'));
        return;
    }
    
    const token = userData.jwtToken;

    try {
        // Fetch the list of agents
        const response = await axios.get('https://api.codebolt.ai/api/agents/list', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        // Fetch the username
        const usernameResponse = await axios.get(
            'https://api.codebolt.ai/api/auth/check-username',
            {
                headers: {
                    'Authorization': `Bearer ${token}` 
                }
            }
        );

        if (!usernameResponse.data || !usernameResponse.data.usersData || usernameResponse.data.usersData.length === 0) {
            console.log(chalk.red('Failed to retrieve username or no user data available.'));
            return;
        }

        const username = usernameResponse.data.usersData[0].username;

        // Filter agents created by the current user
        const agents = response?.data?.filter(agent => agent.createdByUser === username) || [];

        if (agents.length === 0) {
            console.log(chalk.yellow('No agents found.'));
        } else {
            console.log(chalk.green('List of agents:'));
            agents.forEach(agent => {
                console.log(chalk.blue(`Agent ID: ${agent.id}`));
                console.log(chalk.blue(`Agent Name: ${agent.title}`));
                console.log(chalk.blue(`Status: ${agent.status}`));
                console.log('-------------------------');
            });
        }
    } catch (error) {
        console.error(chalk.red('Error fetching agents list:'), error);
    }
};


module.exports = { list };
