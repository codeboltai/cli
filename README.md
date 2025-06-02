# Codebolt CLI

A powerful command-line interface for creating, managing, and deploying Codebolt agents and tools. The CLI enables developers to build intelligent AI assistants that can handle software development lifecycle (SDLC) tasks and provide specialized functionality.

## 🚀 Quick Start

```bash
# Install globally
npm install -g codebolt-cli
```

## Authentication
Before using most features, you'll need to authenticate:

```bash
codebolt-cli login
```

To logout:
```bash
codebolt-cli logout
```

## Commands

### Version
Check the application version:
```bash
codebolt-cli version
```

### Agent Management

#### Create Agent
Create a new Codebolt Agent:
```bash
codebolt-cli createagent
codebolt-cli createagent -n "MyAgent" --quick
```

#### Publish Agent
Publish an agent to the registry:
```bash
codebolt-cli publishagent [folderPath]
```

#### List Agents
List all agents created and uploaded by you:
```bash
codebolt-cli listagents
```

#### Start Agent
Start an agent in the specified working directory:
```bash
codebolt-cli startagent [workingDir]
```

#### Pull Agent
Pull the latest agent configuration from server:
```bash
codebolt-cli pullagent [workingDir]
```

#### Clone Agent
Clone an agent using its unique_id:
```bash
codebolt-cli cloneagent <unique_id> [targetDir]
```

### MCP Tool Management

#### Create Tool
Create a new MCP (Model Context Protocol) tool:
```bash
codebolt-cli createtool
codebolt-cli createtool -n "MyTool" -i "my-tool-id" -d "Tool description"
```

Options:
- `-n, --name <name>`: Name of the tool
- `-i, --id <unique-id>`: Unique identifier (no spaces)
- `-d, --description <description>`: Description of the tool
- `-p, --parameters <json>`: Tool parameters in JSON format

#### Publish Tool
Publish an MCP tool to the registry:
```bash
codebolt-cli publishtool [folderPath]
```

This command will:
- Read the `codebolttool.yaml` configuration file
- Package and upload the tool's source code
- Register the tool in the MCP registry
- Handle both new tool creation and updates

**Requirements for publishing:**
- A `codebolttool.yaml` file must be present in the tool directory
- Required fields in `codebolttool.yaml`: `name`, `uniqueName`, `description`

**Interactive prompts for new tools:**
- GitHub repository URL (optional)
- Category selection
- Tags (comma-separated)
- API key requirement

#### List Tools
List all MCP tools published by you:
```bash
codebolt-cli listtools
```

#### Pull Tools
Pull the latest MCP tool configuration from server:
```bash
codebolt-cli pulltools [workingDir]
```

This command will:
- Read your local `codebolttool.yaml` file
- Fetch the latest configuration from the server
- Compare versions and prompt for confirmation if needed
- Update your local configuration file

#### Run Tool
Run a specified tool with a file:
```bash
codebolt-cli runtool <command> <file>
```

#### Inspect Tool
Inspect a server file using the MCP inspector:
```bash
codebolt-cli inspecttool <file>
```

## MCP Tool Configuration

When creating or publishing MCP tools, ensure your `codebolttool.yaml` file contains:

```yaml
name: "My MCP Tool"
uniqueName: "my-mcp-tool"
description: "Description of what this tool does"
version: "1.0.0"
parameters:
  param1: "value1"
  param2: "value2"
```

## File Structure

### For Agents
Agents should contain a `codeboltagent.yaml` configuration file.

### For MCP Tools
MCP tools should contain a `codebolttool.yaml` configuration file and follow the MCP protocol standards.

## Examples

### Publishing a new MCP tool:
```bash
cd my-mcp-tool-directory
codebolt-cli publishtool
```

### Updating an existing MCP tool:
```bash
cd my-existing-tool
codebolt-cli publishtool
```

The CLI will automatically detect if it's an update based on the `uniqueName` in your configuration.

## Error Handling
The CLI provides detailed error messages and colored output for better user experience. Make sure you're authenticated and have the required configuration files before running publish commands.

## Author
Codebolt Team

### Agent Management
- **Create Agents**: Interactive wizard for agent creation
- **Publish Agents**: Deploy agents to the Codebolt platform
- **Clone Agents**: Copy and customize existing agents
- **Start Agents**: Run agents locally for development
- **Sync Agents**: Pull latest configurations from the platform

### Tool Development
- **Create Tools**: Build MCP-compatible tools
- **Test Tools**: Run and debug tools locally
- **Inspect Tools**: Interactive debugging with MCP inspector
- **Parameter Configuration**: Flexible tool parameterization

### Authentication & Management
- **Secure Login**: OAuth-based authentication
- **Session Management**: Persistent login sessions
- **Project Organization**: Structured directory management
- **Team Collaboration**: Share and collaborate on agents

## 🛠️ Installation

### Prerequisites
- Node.js 14.0 or higher
- npm 6.0 or higher

### Global Installation (Recommended)
```bash
npm install -g codebolt-cli
```

### Local Installation
```bash
npm install codebolt-cli
npx codebolt-cli version
```

### Development Installation
```bash
git clone https://github.com/codeboltai/cli.git
cd cli
npm install
npm link
```

## 📖 Documentation

Comprehensive documentation is available at [docs.codebolt.ai](https://docs.codebolt.ai/developer/cli/):

- **[Overview](https://docs.codebolt.ai/developer/cli/overview)** - Introduction and architecture
- **[Installation](https://docs.codebolt.ai/developer/cli/installation)** - Detailed setup guide
- **[Authentication](https://docs.codebolt.ai/developer/cli/authentication)** - Login and session management
- **[Agent Development](https://docs.codebolt.ai/developer/cli/agents)** - Creating and managing agents
- **[Tool Development](https://docs.codebolt.ai/developer/cli/tools)** - Building custom tools
- **[Command Reference](https://docs.codebolt.ai/developer/cli/commands)** - Complete command documentation
- **[Examples](https://docs.codebolt.ai/developer/cli/examples)** - Practical usage examples

## 🎯 Common Commands

### Authentication
```bash
codebolt-cli login          # Login to your account
codebolt-cli logout         # End current session
```

### Agent Commands
```bash
codebolt-cli createagent                    # Create new agent (interactive)
codebolt-cli createagent --name "My Agent" # Create with name
codebolt-cli publishagent [path]           # Publish agent to platform
codebolt-cli listagents                     # List your agents
codebolt-cli startagent [path]             # Start agent locally
codebolt-cli pullagent [path]              # Sync with platform
codebolt-cli cloneagent <id> [path]        # Clone existing agent
```

### Tool Commands
```bash
codebolt-cli createtool                     # Create new tool (interactive)
codebolt-cli createtool --name "Tool"      # Create with options
codebolt-cli runtool <command> <file>      # Run tool command
codebolt-cli inspecttool <file>            # Debug tool with MCP inspector
```

### Utility Commands
```bash
codebolt-cli version        # Show CLI version
codebolt-cli --help         # Show help information
```

## 📁 Project Structure

The CLI organizes projects using the `.codeboltAgents` directory:

```
your-project/
├── .codeboltAgents/
│   ├── agents/
│   │   ├── my-agent/
│   │   │   ├── codeboltagent.yaml
│   │   │   ├── package.json
│   │   │   ├── index.js
│   │   │   └── src/
│   │   └── another-agent/
│   └── tools/
│       ├── my-tool/
│       │   ├── codebolttool.yaml
│       │   ├── package.json
│       │   └── index.js
│       └── another-tool/
└── your-project-files...
```

## 🔧 Configuration

### Agent Configuration (`codeboltagent.yaml`)
```yaml
title: "My Agent"
description: "Agent description"
unique_id: "my-agent-id"
tags: ["tag1", "tag2"]

metadata:
  agent_routing:
    worksonblankcode: true
    worksonexistingcode: true
    supportedlanguages: ["javascript", "typescript"]
    supportedframeworks: ["react", "express"]
  
  sdlc_steps_managed:
    - name: "Code Generation"
      example_instructions:
        - "Generate React component"

actions:
  - name: "component"
    description: "Generate component"
    actionPrompt: "Create a new component"
```

### Tool Configuration (`codebolttool.yaml`)
```yaml
name: "My Tool"
description: "Tool description"
version: "1.0.0"
uniqueName: "my-tool-id"

parameters:
  rootPath:
    type: "string"
    description: "Root directory"
    default: "./"
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
```bash
git clone https://github.com/codeboltai/cli.git
cd cli
npm install
npm link
```

### Running Tests
```bash
npm test
npm run test:watch
```

### Code Style
```bash
npm run lint
npm run format
```

## 📝 Examples

### Create a React Component Generator
```bash
# Create agent
codebolt-cli createagent --name "React Generator"

# Configure during interactive setup:
# - Languages: javascript, typescript
# - Frameworks: react, next.js
# - SDLC Steps: Code Generation
# - Actions: component, hook

# Test locally
codebolt-cli startagent ./.codeboltAgents/agents/react-generator

# Publish when ready
codebolt-cli publishagent ./.codeboltAgents/agents/react-generator
```

### Create a File Management Tool
```bash
# Create tool with parameters
codebolt-cli createtool \
  --name "File Manager" \
  --id "file-manager" \
  --description "Manages file operations" \
  --parameters '{"rootPath": "./", "extensions": [".js", ".ts"]}'

# Test tool
codebolt-cli runtool list_files ./.codeboltAgents/tools/file-manager/index.js

# Debug if needed
codebolt-cli inspecttool ./.codeboltAgents/tools/file-manager/index.js
```

## 🐛 Troubleshooting

### Common Issues

**Authentication Error**
```bash
Error: Not authenticated
```
Solution: Run `codebolt-cli login`

**Agent Not Found**
```bash
Error: Agent configuration not found
```
Solution: Ensure you're in the correct directory or specify the path

**Tool Validation Error**
```bash
Error: Invalid tool configuration
```
Solution: Check `codebolttool.yaml` syntax and required fields

### Debug Mode
Enable verbose logging:
```bash
DEBUG=codebolt:* codebolt-cli <command>
```

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Documentation**: [docs.codebolt.ai](https://docs.codebolt.ai)
- **Platform**: [codebolt.ai](https://codebolt.ai)
- **GitHub**: [github.com/codeboltai/cli](https://github.com/codeboltai/cli)
- **Discord**: [discord.gg/codebolt](https://discord.gg/codebolt)
- **Support**: [support@codebolt.ai](mailto:support@codebolt.ai)

## 🏷️ Version

Current version: 1.1.35

For version history and changelog, see [CHANGELOG.md](CHANGELOG.md).
