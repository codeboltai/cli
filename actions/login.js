const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const chalk = require('chalk');
const { saveUserData, checkUserAuth, deleteUserData } = require('./userData');

// Function to log out the user
const logout = () => {
    deleteUserData();
    console.log('Logged out successfully');
};

// Function to sign in the user
const signIn = () => {
    if (checkUserAuth()) {
        console.log(chalk.yellow('Already logged in.'));
    } else {
        const uuid = uuidv4();
        console.log(chalk.blue(`Please open this URL to login: http://portal.codebolt.ai/performSignIn?uid=${uuid}&loginflow=app`));

        const intervalId = setInterval(async () => {
            try {
                const response = await axios.post(
                    `https://api.codebolt.ai/api/auth/addonetimetoken?oneTimeToken=${uuid}`
                );

                if (response.status === 200) {
                    clearInterval(intervalId);
                    console.log(chalk.green('Login successful!'));
                    saveUserData(response.data);
                }
            } catch (error) {
                // console.error(chalk.red('Error checking token:', error));
            }
        }, 1000);
    }
};

module.exports = {
    signIn,
    logout
};
