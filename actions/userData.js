const path = require('path');
const os = require('os');
const usersFile = path.join(os.homedir(), '.codebolt', 'users.json');

export const getUserData = () => {
    try {
        const data = fs.readFileSync(usersFile, 'utf8');
        //TODO: Decode the token and get the user data to show to the user
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading user data:', error);
    }
}

export const saveUserData = (userData) => {
    try {
        fs.writeFileSync(usersFile, JSON.stringify(userData, null, 4));
        console.log('User data saved successfully');
    } catch (error) {
        console.error('Error saving user data:', error);
    }
}

export const checkUserAuth = () => {
    const userData = getUserData();
    //TODO: Along with the file available check if the token is expired or not.
    if (!userData) {
        console.log('Please login first');
        return false;
    }
    return true;
}

export const deleteUserData = () => {
    try {
        fs.unlinkSync(usersFile);
        console.log('User data deleted successfully');
    } catch (error) {
        console.error('Error deleting user data:', error);
    }
}