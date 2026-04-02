const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const chalk = require('chalk');
const { saveUserData, checkUserAuth, deleteUserData } = require('./userData');

const logout = () => {
    deleteUserData();
    console.log('Logged out successfully');
};

const signIn = async (options = {}) => {
    // Login with a pre-created login token (skip browser flow)
    if (options.token) {
        try {
            // Validate the token by making a test API call
            const response = await axios.get(
                'https://api.codebolt.ai/api/auth/check-username',
                { headers: { Authorization: `Bearer ${options.token}` } }
            );

            if (response.data?.usersData?.length > 0) {
                const user = response.data.usersData[0];
                saveUserData({
                    jwtToken: options.token,
                    userId: user.userId,
                    userName: user.username || '',
                });
                console.log(chalk.green('Login successful with token!'));
            } else {
                console.log(chalk.red('Invalid token. Could not authenticate.'));
            }
        } catch (error) {
            console.log(chalk.red('Invalid token. Could not authenticate.'));
        }
        return;
    }

    // Standard browser-based login flow
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
                // Polling — silently retry
            }
        }, 1000);
    }
};

module.exports = {
    signIn,
    logout
};
