const fs = require('fs'); // Import the fs module
const path = require('path');
const yaml = require('js-yaml'); // Import the yaml parser library
const chalk = require('chalk');

async function checkYamlDetails(folderPath) {
	const yamlPathName = path.join(folderPath, 'codeboltagent.yaml');

	// Check if the YAML file exists
	try {
		await fs.promises.access(yamlPathName, fs.constants.F_OK);
	} catch (error) {
		console.error('YAML file does not exist:', error);
		return false;
	}

	try {
		const ymlFileContent = await fs.promises.readFile(yamlPathName); // Read the YAML file content
		const parsedYAML = yaml.load(ymlFileContent.toString('utf8'));
		const validationError = validateYAML(parsedYAML);
		if (validationError) {
			console.log(chalk.red(validationError));
			return false;
		} else {
			return parsedYAML;
		}
	} catch (error) {
		console.error('An error occurred while processing the YAML file:', error);
		return false;
	}
}

function validateYAML(parsedYAML) {
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
		return `Missing required fields: ${missingFields.join(', ')}`;
	}

	// Check if unique_id is lowercase
	if (parsedYAML.unique_id && parsedYAML.unique_id !== parsedYAML.unique_id.toLowerCase()) {
		return `The unique_id must be lowercase. Current value: ${parsedYAML.unique_id}`;
	}

	// Check for missing metadata fields
	if (!parsedYAML.metadata) {
		return 'Missing metadata field';
	}
	const missingMetadataFields = metadataFields.filter(field => !parsedYAML.metadata[field]);
	if (missingMetadataFields.length > 0) {
		return `Missing required metadata fields: ${missingMetadataFields.join(', ')}`;
	}

	// Check for missing agent_routing fields
	if (!parsedYAML.metadata.agent_routing) {
		return 'Missing agent_routing field in metadata';
	}
	const agentRoutingFields = ['supportedlanguages', 'supportedframeworks'];
	const missingAgentRoutingFields = agentRoutingFields.filter(field => !parsedYAML.metadata.agent_routing[field]);
	if (missingAgentRoutingFields.length > 0) {
		return `Missing required agent_routing fields: ${missingAgentRoutingFields.join(', ')}`;
	}

	return null; // No validation errors
}

module.exports = {
    checkYamlDetails,
    validateYAML
};
