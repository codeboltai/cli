const chalk = require('chalk');
const axios = require('axios');

const list = async () => {
    try {
        const response = await axios.get('https://api.codebolt.ai/api/list');
        const agents = response.data.agents;

        if (agents.length === 0) {
            console.log(chalk.yellow('No agents found.'));
        } else {
            console.log(chalk.green('List of agents:'));
            agents.forEach(agent => {
                console.log(chalk.blue(`Agent ID: ${agent.id}`));
                console.log(chalk.blue(`Agent Name: ${agent.name}`));
                console.log(chalk.blue(`Status: ${agent.status}`));
                console.log('-------------------------');
            });
        }
    } catch (error) {
        console.error(chalk.red('Error fetching agents list:'), error);
    }
};

module.exports = { list };
