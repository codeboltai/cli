# Codebolt CLI Tool

## Description
Codebolt is a comprehensive CLI tool created using Node.js. It allows developers to create, manage, and publish AI agents and MCP (Model Context Protocol) tools, along with various utility functions for development.

## Installation
To install Codebolt CLI tool globally, ensure you have Node.js and npm installed, then run:

```bash
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

## License
ISC
