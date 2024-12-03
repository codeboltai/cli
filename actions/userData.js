const path = require('path');
const os = require('os');
const fs = require('fs')
const usersDir = path.join(os.homedir(), '.codebolt');
const usersFile = path.join(usersDir, 'users.json');

// Ensure the directory and file exist
const ensureFileExists = () => {
    if (!fs.existsSync(usersDir)) {
        try {
            fs.mkdirSync(usersDir, { recursive: true }); // Create the directory if it doesn't exist
        } catch (error) {
            console.error('Error creating directory:', error);
        }
    }

    if (!fs.existsSync(usersFile)) {
        try {
            fs.writeFileSync(usersFile, JSON.stringify([])); // Initialize with an empty array
        } catch (error) {
            console.error('Error creating user data file:', error);
        }
    }
};

const getUserData = () => {
    try {
        ensureFileExists(); // Ensure the directory and file exist
        const data = fs.readFileSync(usersFile, 'utf8');
        // TODO: Decode the token and get the user data to show to the user
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading user data:', error);
        return false;
    }
};


const saveUserData = (userData) => {
    try {
        fs.writeFileSync(usersFile, JSON.stringify(userData, null, 4));
        console.log('User data saved successfully');
    } catch (error) {
        console.error('Error saving user data:', error);
    }
}

const checkUserAuth = () => {
    const userData = getUserData();
    //TODO: Along with the file available check if the token is expired or not.
    if (Object.keys(userData).length === 0) {
        console.log('Please login first');
        return false;
    }
    return true;
}

const deleteUserData = () => {
    try {
        fs.unlinkSync(usersFile);
        // console.log('User data deleted successfully');
    } catch (error) {
        // console.error('Error deleting user data:', error);
    }
}

module.exports = {
    getUserData,
    saveUserData,
    deleteUserData,
    checkUserAuth
};
