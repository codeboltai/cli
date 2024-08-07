const chalk = require('chalk');
const fs = require('fs');
const archiver = require('archiver');
const {createReadStream, createWriteStream} = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const AdmZip = require('adm-zip');
const yaml = require('js-yaml');
const StreamZip = require('node-stream-zip');
const path = require('path');
const { checkUserAuth, getUserData } = require('./userData');
const { validateYAML, checkYamlDetails } = require('../services/yamlService');

// Function to check for node_modules and extract .yaml file
async function processZipFile(zipFilePath) {

	try { // Create a new StreamZip instance
		const zip = new StreamZip.async ({file: zipFilePath, storeEntries: true});

		// List entries in the zip file
		const entries = await zip.entries();

		// Check for node_modules directory
		const containsNodeModules = Object.keys(entries).some(fileName => fileName.includes('node_modules'));
		if (containsNodeModules) {
			console.error('Please remove the `node_modules` directory from your zip file!');
			await zip.close();
			return;
		}
		// Find and process the .yaml file
		const ymlFileName = Object.keys(entries).find(fileName => fileName.endsWith('.yaml'));
		if (ymlFileName) {
			const ymlFileContent = await zip.entryData(ymlFileName);
			const parsedYAML = yaml.load(ymlFileContent.toString('utf8'));

			// Validate the YAML content (implement your own validation logic)
			const validationError = validateYAML(parsedYAML);
			if (validationError) {
				console.error('Validation Warning:', validationError);
				await zip.close();
				return;
			} else {
				return parsedYAML
			}

		} else {
			console.error('No .yaml file found in the zip archive.');
			return false;
		}

		// Close the zip file
		await zip.close();

	} catch (error) {
		console.error('An error occurred:', error);
	}
}




const uploadFolder = async (targetPath) => {
	let authToken;
  
	// Check if the user is logged in
	if (!checkUserAuth()) {
	  console.log(chalk.red('User not authenticated. Please login first.'));
	  return;
	}
  
	try {
	  const data = getUserData();
	  authToken = data.jwtToken;
    
	  console.log(chalk.blue('Processing the Code....'));
    
	  const folderPath = targetPath || '.';
	  const folder = path.resolve(folderPath);
	  const zipFilePath = `${folder}.zip`;
  
	  const YamlValidation = await checkYamlDetails(folderPath);
	  if (!YamlValidation) {
		console.log('YAML validation failed.');
		return;
	  }
  
	  // Create a file stream to write the zip file
	  const output = createWriteStream(zipFilePath);
	  const archive = archiver('zip', { zlib: { level: 9 } });
  
	  // Pipe archive data to the file
	  archive.pipe(output);
  
	  // Read .gitignore file and add its contents to the archiver's ignore list
	  const gitignorePath = path.join(folder, '.gitignore');
	  const ignoreFiles = ['node_modules/**/*', '**/*.zip']; // Ignore node_modules and zip files
	  if (fs.existsSync(gitignorePath)) {
		const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
		ignoreFiles.push(...gitignoreContent.split('\n').filter(line => line && !line.startsWith('#')));
	  }
  
	  // Add files to the archive while respecting .gitignore
	  archive.glob('**/*', {
		cwd: folder,
		ignore: ignoreFiles
	  });
  
	  // Finalize the archive
	  await new Promise((resolve, reject) => {
		output.on('close', resolve);
		archive.on('error', reject);
		archive.finalize();
	  });
  
	  // Handle the upload
	  const formData = new FormData();
	  formData.append('file', createReadStream(zipFilePath));
  
	  const uploadResponse = await axios.post('https://codeboltai.web.app/api/upload/single', formData, {
		headers: formData.getHeaders()
	  });
  
	  if (uploadResponse.status === 200) {
		const getUsernameResponse = await axios.get(
		  'https://codeboltai.web.app/api/auth/check-username',
		  { headers: { 'Authorization': `Bearer ${authToken}` } }
		);
  
		const username = getUsernameResponse.data.usersData[0].username;
  
		const agentData = {
		  ...YamlValidation,
		  zipFilePath: uploadResponse.data.url,
		  createdByUser: username
		};
  
		const agentResponse = await axios.post(
		  'https://codeboltai.web.app/api/agents/add',
		  agentData
		);
  
		if (agentResponse.status === 201) {
		  console.log(agentResponse.data.message);
		} else {
		  console.log(`Unexpected status code: ${agentResponse.data.message}`);
		}
	  } else {
		console.log(`File upload failed with status code: ${uploadResponse.status}`);
	  }
  
	} catch (error) {
	  console.error('Error:', error.message || error);
	}
  };
  


module.exports = {
	uploadFolder
};
