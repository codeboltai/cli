# Docker Provider

A simple service that manages Docker containers for the Codebolt application. It creates Docker containers running the dockerserver and handles communication between the Codebolt application and containers.

## Architecture

The Docker Provider has a simple, straightforward architecture:

```
Codebolt Application
        ↕ WebSocket
Docker Provider
  ├── DockerManager       ← Creates/manages containers  
  ├── CodeboltWebSocketClient    ← Connects to Codebolt app
  └── DockerServerWebSocketClient ← Connects to Docker server
        ↕ WebSocket
Docker Container (dockerserver)
        ↕
Agent (agentrunningindocker)
```

## How it works

1. **Parallel Startup**: Docker container creation and Codebolt WebSocket connection happen simultaneously
2. **Health Check**: Waits for Docker server to be ready 
3. **Connect Downstream**: Connects to Docker server in container
4. **Message Routing**: Routes messages between Codebolt app and Docker server
5. **Ready**: Notifies Codebolt that system is operational

## Files

- `src/index.ts` - Main entry point with all coordination logic
- `src/core/dockerManager.ts` - Simple Docker container management
- `src/core/websocketClient.ts` - Codebolt WebSocket connection
- `src/core/dockerServerWebSocketClient.ts` - Docker server WebSocket connection
- `src/handlers/messageHandler.ts` - Message routing
- `src/config/` - Configuration

## Usage

```bash
# Set required environment variables
export agentId="docker-provider-1"
export CODEBOLT_SERVER_URL="localhost"  
export SOCKET_PORT="12345"

# Start the provider
npm start
```

## Configuration

### Required
- `agentId` - Unique agent identifier

### Optional
- `CODEBOLT_SERVER_URL` (default: "localhost")
- `SOCKET_PORT` (default: "12345") 
- `DOCKER_IMAGE` (default: "codebolt/dockerserver:latest")
- `DOCKER_CONTAINER_NAME` (default: "codebolt-dockerserver")
- `DOCKER_NETWORK_NAME` (default: "codebolt-network")

## Development

```bash
# Build
npm run build

# Development mode
npm run dev

# Lint
npm run lint
```

## Dependencies

- **dockerode** - Docker API client
- **ws** - WebSocket implementation  
- **@codebolt/shared-types** - Shared types

That's it! Simple and straightforward.