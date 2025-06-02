const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const stream = require('stream');
const pipeline = promisify(stream.pipeline);
const unzipper = require('unzipper');

async function cloneAgent(unique_id, targetDir = process.cwd()) {
    try {
        // Fetch agent details
        const response = await axios.get(`https://api.codebolt.ai/api/agents/detailbyuid?unique_id=${unique_id}`);
        const agentData = response.data;

        if (!agentData.sourceCodeUrl) {
            console.error('Error: No source code available for this agent');
            return;
        }

        console.log(`Cloning agent: ${agentData.title}`);
        console.log(`Description: ${agentData.description}`);

        // Create target directory if it doesn't exist
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // Download and extract the source code
        const zipResponse = await axios({
            method: 'GET',
            url: agentData.sourceCodeUrl,
            responseType: 'stream'
        });

        const zipPath = path.join(targetDir, 'agent.zip');
        await pipeline(zipResponse.data, fs.createWriteStream(zipPath));

        // Extract the zip file
        await fs.createReadStream(zipPath)
            .pipe(unzipper.Extract({ path: targetDir }))
            .promise();

        // Clean up the zip file
        fs.unlinkSync(zipPath);

        console.log(`Successfully cloned agent to: ${targetDir}`);
        console.log('Agent metadata:');
        console.log(`- Title: ${agentData.title}`);
        console.log(`- Description: ${agentData.description}`);
        console.log(`- Version: ${agentData.version}`);
        console.log(`- Tags: ${agentData.tags ? agentData.tags.join(', ') : 'No tags'}`);

    } catch (error) {
        console.error('Error cloning agent:', error.message);
        if (error.response) {
            console.error('API Error:', error.response.data);
        }
    }
}

module.exports = { cloneAgent }; 