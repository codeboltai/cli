# Docker Provider - Simplified

## What it does
1. Starts a Docker container 
2. Connects to Codebolt app
3. Routes messages between them

## Main flow (in index.ts)
```typescript
// 1. Create components
const dockerManager = new DockerManager(config);
const codeboltClient = new CodeboltWebSocketClient(config);  
const dockerServerClient = new DockerServerWebSocketClient();

// 2. Set up message routing
codeboltClient.setDockerServerCallback((msg) => dockerServerClient.sendToDockerServer(msg));
dockerServerClient.setMessageCallback((msg) => codeboltClient.sendFromDockerServer(msg));

// 3. Start Docker + connect to Codebolt in parallel
const [containerInfo] = await Promise.all([
  dockerManager.createAndStartContainer(),
  codeboltClient.initializeWebSocket()
]);

// 4. Wait for Docker server to be ready
while (!await dockerManager.isContainerHealthy()) { wait... }

// 5. Connect to Docker server
await dockerServerClient.connectToDockerServer(containerInfo);

// 6. Tell Codebolt we're ready
codeboltClient.sendFromDockerServer({ type: 'system-ready', containerInfo });
```

## Components

**DockerManager** - Creates/manages Docker containers
- `createAndStartContainer()` - Main method
- `isContainerHealthy()` - Health check
- `stopAndRemoveContainer()` - Cleanup

**CodeboltWebSocketClient** - Connects to Codebolt app  
- `initializeWebSocket()` - Connect
- `sendFromDockerServer()` - Send message to app

**DockerServerWebSocketClient** - Connects to Docker server
- `connectToDockerServer()` - Connect to container
- `sendToDockerServer()` - Send message to server

That's it! Simple and clear.
