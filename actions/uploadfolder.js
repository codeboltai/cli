const chalk = require('chalk');
// const { post } = require('axios');
// const { createWriteStream, createReadStream } = require('fs');
// const archiver = require('archiver');
// const fs = require('fs')
// const axios = require('axios')
const fs = require('fs');
const archiver = require('archiver');
const {createReadStream, createWriteStream} = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const AdmZip = require('adm-zip');
const yaml = require('js-yaml');
const StreamZip = require('node-stream-zip');
const path = require('path')
// Function to check for node_modules and extract .yaml file
async function processZipFile(zipFilePath) {

  console.log("zipFilePath---",zipFilePath)

	try { // Create a new StreamZip instance
		const zip = new StreamZip.async ({file: zipFilePath, storeEntries: true});

		// List entries in the zip file
		const entries = await zip.entries();
    console.log('Zip entries:', Object.keys(entries));


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

const validateYAML = (parsedYAML) => {
	const requiredFields = [
		'title',
		'unique_id',
		'initial_message',
		'description',
		'tags',
		'longDescription',
		'avatarSrc',
		'metadata',
		'actions'
	];
	const metadataFields = ['agent_routing'];

	// Check for missing required fields
	const missingFields = requiredFields.filter(field => !parsedYAML[field]);
	if (missingFields.length > 0) {
		return `Missing required fields: ${
			missingFields.join(', ')
		}`;
	}

	// Check for missing metadata fields
	if (!parsedYAML.metadata) {
		return 'Missing metadata field';
	}
	const missingMetadataFields = metadataFields.filter(field => !parsedYAML.metadata[field]);
	if (missingMetadataFields.length > 0) {
		return `Missing required metadata fields: ${
			missingMetadataFields.join(', ')
		}`;
	}

	// Check for missing agent_routing fields
	if (!parsedYAML.metadata.agent_routing) {
		return 'Missing agent_routing field in metadata';
	}
	const agentRoutingFields = ['supportedlanguages', 'supportedframeworks'];
	const missingAgentRoutingFields = agentRoutingFields.filter(field => !parsedYAML.metadata.agent_routing[field]);
	if (missingAgentRoutingFields.length > 0) {
		return `Missing required agent_routing fields: ${
			missingAgentRoutingFields.join(', ')
		}`;
	}

	return null; // No validation errors
};

const uploadFolder = async (targetPath) => {


  const folderPath = targetPath || '.';


	// const YamlValidation = await processZipFile(folderPath)

	// console.log(YamlValidation);

	// return;
	// Get all the entries (files/folders) in the ZIP file

	// Resolve folder path and create zip file path
  const folder = path.resolve(folderPath);
  const zipFilePath = `${folder}.zip`;

  // Create a file stream to write the zip file
  const output = createWriteStream(zipFilePath);
  const archive = archiver('zip', {
    zlib: { level: 9 }
  });

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

  // Finalize the archive (i.e., finalize the zip file)
  archive.finalize();

  console.log(`Creating zip: ${zipFilePath}`);

  // Listen for the close event to handle the upload
  output.on('close', async () => {
    try {
      // Process the ZIP file and validate the YAML content
      const YamlValidation = await processZipFile(zipFilePath);
  
      if (YamlValidation.title) {
        // Prepare the form data for file upload
        const formData = new FormData();
        formData.append('file', createReadStream(zipFilePath));
  
        // Make the HTTP POST request to upload the file
        const uploadResponse = await axios.post('https://codeboltai.web.app/api/upload/single', formData, {
          headers: formData.getHeaders()
        });
  
        if (uploadResponse.status === 200) {
          // Prepare data for agent creation
          const agentData = {
            ...YamlValidation,
            zipFilePath: uploadResponse.data.url
          };
  
          // Make the HTTP POST request to add the agent
          const agentResponse = await axios.post(
            'https://codeboltai.web.app/api/agents/add',
            agentData
          );
  
          // Handle the response for agent creation
          if (agentResponse.status === 201) {
            console.log(agentResponse.data.message);
          } else {
            console.log(`Unexpected status code: ${agentResponse.data.message}`);
          }
        } else {
          console.log(`File upload failed with status code: ${uploadResponse.status}`);
        }
      } else {
        console.log('YAML validation failed.');
      }
    } catch (error) {
      console.error('Error handling zip file:', error);
    }
  });

  archive.on('error', (err) => {
    console.error('Archive error:', err);
  });

};


module.exports = {
	uploadFolder
};
