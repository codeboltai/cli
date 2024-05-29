const { v4: uuidv4 } = require('uuid');
const axios = require('axios')
const fs = require('fs');
const path = require('path');
const os = require('os');
const usersFile = path.join(os.homedir(), '.codebolt', 'users.json');
const chalk = require('chalk');

// Function to delete the users.json file
function deleteUserFile() {
    try {
        fs.unlinkSync(usersFile);
        // console.log('users.json file deleted successfully');
    } catch (err) {
        // console.error('Error deleting users.json file:', err);
    }
}

// Function to log out the user
const logout = () => {
    deleteUserFile();
    console.log('Logged out successfully');
};


const signIn = () => {
    const uuid = uuidv4();

    // Simulating window.open in a Node.js environment
    
    console.log(chalk.blue(`Please open this URL to login: http://portal.codebolt.ai/performSignIn?uid=${uuid}&loginflow=app`));
    const intervalId = setInterval(async () => {
      try {
        const response = await axios.get(
          `https://us-central1-codeboltai.cloudfunctions.net/checkOneTimeToken?oneTimeToken=${uuid}`
        );
        // console.log(response.data)
        if (response.status === 200) {
          clearInterval(intervalId);
          console.log(chalk.green('Login successful!'));
          saveUserApiResponse(response.data); 
        }
       // Assuming there is a function saveUserApiResponse to handle saving the response
      } catch (error) {
        // console.error('Error checking token:', error);
      }
    }, 1000);
  };


// Function to read user data from the file
function readUsers() {
    try {
        const data = fs.readFileSync(usersFile, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

// Function to write user data to the file
function saveUserApiResponse(user) {
    fs.writeFileSync(usersFile, JSON.stringify(user, null, 4));
}

module.exports={
    signIn,
    logout
}
