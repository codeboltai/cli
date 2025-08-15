#!/usr/bin/env node

import { CodeboltWebSocketClient } from './core/codeboltWebsocketClient';
import { RemoteEnvironmentWebSocketClient } from './core/remoteEnvironmentWebSocketClient';

/**
 * Main entry point for Docker Provider Agent
 */
async function main() {
  console.log('🚀 Starting Remote Provider...');
  
 let config;
 // your cofig for codeboltWebsocketClient
  const codeboltClient = new CodeboltWebSocketClient(config);
  const remoteEnvironmentClient = new RemoteEnvironmentWebSocketClient();

  // Set up message routing
  codeboltClient.setDockerServerCallback((message) => {
    remoteEnvironmentClient.sendToRemoteEnvironmentServer(message);
  });
  
  remoteEnvironmentClient.setMessageCallback((message) => {
    codeboltClient.sendFromRemoteServer(message);
  });

  // Handle graceful shutdown
  const shutdown = async () => {
    console.log('🛑 Shutting down...');
    try {
      remoteEnvironmentClient.close();
      codeboltClient.close();
      console.log('✅ Shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('❌ Shutdown error:', error);
      process.exit(1);
    }
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('SIGQUIT', shutdown);
  
  try {
    console.log(`📋 Agent: ${config.agentId} → ${config.serverUrl}:${config.socketPort}`);

    // Start Docker container and connect to Codebolt in parallel
    console.log('⚙️  Starting Docker container and connecting to Codebolt...');
    const [containerInfo] = await Promise.all([
      codeboltClient.initializeWebSocket()
    ]);

   

    // Wait for Docker server to be ready
    
    await remoteEnvironmentClient.connectToRemoteServer();
    console.log('✅ Connected to Docker server');

    // Notify Codebolt that system is ready
    codeboltClient.sendFromRemoteServer({
      type: 'system-ready',
      timestamp: new Date().toISOString(),
    });

    console.log('🎉 Docker Provider is ready!');
    
  } catch (error) {
    console.error('❌ Failed to start:', error);
    process.exit(1);
  }
}

// Run main function if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Unhandled error in main:', error);
    process.exit(1);
  });
}
