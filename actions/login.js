const chalk = require('chalk');
const { v4: uuidv4 } = require('uuid');
const open = require('open');
const axios = require('axios');
const fs = require('fs');

const login = async () => {
    const uid = uuidv4();
    const loginUrl = `https://api.codebolt.ai/login?uid=${uid}`;
    console.log(chalk.blue('Please click on the link to login:'), chalk.green(loginUrl));

    // Open the login URL in the default browser
    await open(loginUrl);

    // Check login status every second
    const checkLoginStatus = async () => {
        try {
            const response = await axios.get(`https://api.codebolt.ai/loginstatus?uid=${uid}`);
            if (response.data.success) {
                const authid = response.data.authid;
                // Save authid locally
                fs.writeFileSync('authid.txt', authid);
                console.log(chalk.green('Login successful! AuthID saved.'));
                return true;
            }
        } catch (error) {
            console.error(chalk.red('Error checking login status:'), error);
        }
        return false;
    };

    const interval = setInterval(async () => {
        const success = await checkLoginStatus();
        if (success) {
            clearInterval(interval);
        }
    }, 1000);
};

module.exports = { login };
