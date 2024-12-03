const { exec } = require('child_process');

async function runBuild(folder) {
    return new Promise((resolve, reject) => {
        exec('npm run build', { cwd: folder }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Build error: ${stderr}`);
                reject(error);
            } else {
                console.log(`Build output: ${stdout}`);
                resolve();
            }
        });
    });
}

module.exports = {
    runBuild

}