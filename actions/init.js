const chalk = require('chalk');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const inquirer = require('inquirer');

const { checkUserAuth, getUserData } = require('./userData');

const init = async () => {
   try {
        console.log(chalk.blue('🚀 Initializing Codebolt Agent...\n'));
        
        // Prompt for basic details
        const questions = [
            {
                type: 'input',
                name: 'title',
                message: 'Enter agent title:',
                default: 'My Codebolt Agent'
            },
            {
                type: 'input',
                name: 'unique_id',
                message: 'Enter unique identifier (no spaces, lowercase):',
                default: 'mycodeboltagent',
                validate: (input) => {
                    if (input.includes(' ')) {
                        return 'Unique ID cannot contain spaces';
                    }
                    return true;
                }
            },
            {
                type: 'input',
                name: 'description',
                message: 'Enter agent description:',
                default: 'A custom Codebolt agent'
            },
            {
                type: 'input',
                name: 'initial_message',
                message: 'Enter initial greeting message:',
                default: 'Hello! I\'m your AI assistant. How can I help you today?'
            },
            {
                type: 'input',
                name: 'author',
                message: 'Enter author name:',
                default: 'codebolt'
            },
            {
                type: 'input',
                name: 'version',
                message: 'Enter version:',
                default: '1.0.0'
            }
        ];

        const answers = await inquirer.prompt(questions);

        // Create the YAML content
        const agentConfig = {
            title: answers.title,
            unique_id: answers.unique_id,
            initial_message: answers.initial_message,
            description: answers.description,
            tags: [
                'custom-agent',
                'codebolt-agent'
            ],
            longDescription: `A custom agent created for the Codebolt platform with the following capabilities: ${answers.description}`,
            avatarSrc: 'https://placehold.co/200x200',
            avatarFallback: 'CA',
            metadata: {
                agent_routing: {
                    worksonblankcode: true,
                    worksonexistingcode: true,
                    supportedlanguages: [
                        'all',
                        'javascript',
                        'typescript',
                        'python',
                        'go',
                        'ruby'
                    ],
                    supportedframeworks: [
                        'all',
                        'nextjs',
                        'reactjs',
                        'nodejs',
                        'express',
                        'django'
                    ]
                },
                defaultagentllm: {
                    strict: true,
                    modelorder: [
                        'ollama2'
                    ]
                },
                sdlc_steps_managed: [
                    {
                        name: 'codegeneration',
                        example_instructions: [
                            'Generate a new React component',
                            'Create a new API endpoint'
                        ]
                    },
                    {
                        name: 'deployment',
                        example_instructions: [
                            'deploy this file to cloudflare',
                            'deploy this file to firebase'
                        ]
                    }
                ],
                llm_role: [
                    {
                        name: 'documentationllm',
                        description: 'LLM to be used for advanced Documentation. Please select a model that excels in documentation tasks.',
                        strict: true,
                        modelorder: [
                            'gpt-4-turbo',
                            'gpt-3.5-turbo',
                            'mistral7b.perplexity',
                            'mistral7b.any',
                            'llama2-70b',
                            'llama2-15b',
                            'group.documentationmodels'
                        ]
                    },
                    {
                        name: 'testingllm',
                        description: 'LLM to be used for advanced Testing. Please select a model that excels in testing tasks.',
                        strict: true,
                        modelorder: [
                            'gpt-4-turbo',
                            'gpt-3.5-turbo',
                            'mistral7b.perplexity',
                            'mistral7b.any',
                            'llama2-70b',
                            'llama2-15b',
                            'group.testingmodels'
                        ]
                    },
                    {
                        name: 'actionllm',
                        description: 'LLM to be used for executing advanced actions.',
                        strict: true,
                        modelorder: [
                            'gpt-4-turbo',
                            'gpt-3.5-turbo',
                            'mistral7b.perplexity',
                            'mistral7b.any',
                            'llama2-70b',
                            'llama2-15b',
                            'group.actionmodels'
                        ]
                    }
                ]
            },
            actions: [
                {
                    name: 'Execute',
                    description: 'Executes the given task.',
                    detailDescription: 'more detailed description',
                    actionPrompt: 'Please run this code'
                }
            ],
            author: answers.author,
            version: answers.version
        };

        // Convert to YAML
        const yamlContent = yaml.dump(agentConfig, {
            indent: 2,
            lineWidth: -1,
            noRefs: true
        });

        // Write to current directory
        const outputPath = path.join(process.cwd(), 'codeboltagent.yaml');
        fs.writeFileSync(outputPath, yamlContent, 'utf8');

        console.log(chalk.green('✅ Successfully created codeboltagent.yaml at:'), chalk.cyan(outputPath));
        console.log(chalk.yellow('\n📝 You can now customize the configuration file as needed.'));
        
    } catch (error) {
        console.error(chalk.red('❌ Error initializing Codebolt Agent:'), error);
    }
};

module.exports = { init };
