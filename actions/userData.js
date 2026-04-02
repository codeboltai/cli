const path = require('path');
const os = require('os');
const fs = require('fs');

const codeboltDir = path.join(os.homedir(), '.codebolt');
const settingsFile = path.join(codeboltDir, 'settings.json');

/**
 * Read ~/.codebolt/settings.json (shared with CodeBolt desktop app).
 */
const readSettings = () => {
    try {
        if (!fs.existsSync(settingsFile)) return null;
        const raw = fs.readFileSync(settingsFile, 'utf8');
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

/**
 * Write ~/.codebolt/settings.json atomically.
 */
const writeSettings = (settings) => {
    if (!fs.existsSync(codeboltDir)) {
        fs.mkdirSync(codeboltDir, { recursive: true });
    }
    const tmp = settingsFile + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(settings, null, 2));
    fs.renameSync(tmp, settingsFile);
};

/**
 * Get the first user from settings.json (shared with CodeBolt desktop app).
 */
const getUserData = () => {
    const settings = readSettings();
    if (!settings?.codebolt_users?.length) return null;
    return settings.codebolt_users[0];
};

/**
 * Save user auth data into settings.json, matching the CodeBolt desktop app format.
 */
const saveUserData = (userData) => {
    try {
        const settings = readSettings() || {
            codebolt_users: [],
            userProfileSetting: null,
        };

        const token = userData.jwtToken || userData.token || '';
        const userId = userData.userId || '';

        const existingIdx = settings.codebolt_users.findIndex(
            (u) => u.username === userId
        );

        const userEntry = {
            userId: existingIdx >= 0 ? settings.codebolt_users[existingIdx].userId : (settings.codebolt_users.length + 1),
            username: userId,
            userImageUrl: null,
            usertoken: token,
        };

        if (existingIdx >= 0) {
            settings.codebolt_users[existingIdx] = {
                ...settings.codebolt_users[existingIdx],
                ...userEntry,
            };
        } else {
            settings.codebolt_users.push(userEntry);
        }

        writeSettings(settings);
        console.log('User data saved successfully');
    } catch (error) {
        console.error('Error saving user data:', error);
    }
};

/**
 * Check if a user is authenticated.
 */
const checkUserAuth = () => {
    const user = getUserData();
    if (!user || !user.usertoken) {
        return false;
    }
    return true;
};

/**
 * Remove all users from settings.json (logout).
 */
const deleteUserData = () => {
    try {
        const settings = readSettings();
        if (settings) {
            settings.codebolt_users = [];
            writeSettings(settings);
        }
    } catch {
        // Silent fail on logout
    }
};

/**
 * Get the auth token. Priority:
 * 1. CODEBOLT_TOKEN env var
 * 2. usertoken from settings.json
 */
const getAuthToken = () => {
    if (process.env.CODEBOLT_TOKEN) return process.env.CODEBOLT_TOKEN;
    const user = getUserData();
    if (!user) return null;
    return user.usertoken || null;
};

module.exports = {
    getUserData,
    saveUserData,
    deleteUserData,
    checkUserAuth,
    getAuthToken,
};
