const chalk = require('chalk');
const axios = require('axios');

const { checkUserAuth, getUserData } = require('./userData');

const list = async () => {
    if (!checkUserAuth()) {
        console.log(chalk.red('User not authenticated. Please login first.'));
        return;
    }

    const userData = getUserData();
    const token = userData.token;

    try {
        const response = await axios.get('https://codeboltai.web.app/api/agents/list', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

      
        const agents = response.data;

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
