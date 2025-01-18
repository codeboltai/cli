const { exec } = require('child_process');
const path = require('path');

const startAgent = (workingDir) => {
    workingDir = workingDir || '.';
    const env = { ...process.env, SOCKET_PORT: '12345',Is_Dev:true }; // Set the SOCKET_PORT environment variable

    const child = exec('npm start', { cwd: workingDir, env });

    child.stdout.on('data', (data) => {
        console.log(` ${data}`);
    });

    child.stderr.on('data', (data) => {
        console.error(`${data}`);
    });

    child.on('error', (error) => {
        console.error(`Error starting agent: ${error.message}`);
    });

    child.on('exit', (code) => {
        console.log(`Agent process exited with code ${code}`);
    });
};

module.exports = {
    startAgent
};
