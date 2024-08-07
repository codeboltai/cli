const { v4: uuidv4 } = require('uuid');
const axios = require('axios')
const fs = require('fs');
const chalk = require('chalk');
const { saveUserData, getUserData, checkUserAuth, deleteUserData } = require('./userData');

// Function to delete the users.json file


// Function to log out the user
const logout = () => {
    deleteUserData();
    console.log('Logged out successfully');
};


const signIn = () => {
    if (checkUserAuth()) {
        console.log(chalk.yellow('Already logged in.'));
    } else {
        const uuid = uuidv4();
       
        console.log(chalk.blue(`Please open this URL to login: http://portal.codebolt.ai/performSignIn?uid=${uuid}&loginflow=app`));
        
        const intervalId = setInterval(async () => {
          try {
            const response = await axios.get(
              `https://us-central1-codeboltai.cloudfunctions.net/checkOneTimeToken?oneTimeToken=${uuid}`
            );

            if (response.status === 200) {
              clearInterval(intervalId);
              console.log(chalk.green('Login successful!'));
              saveUserData(response.data);
            }
           // Assuming there is a function saveUserApiResponse to handle saving the response
          } catch (error) {
            // console.log('Error checking token:', error);
          }
        }, 1000);
    }
};

module.exports={
    signIn,
    logout
}
