import WebSocket from 'ws';

import { DockerProviderMessageHandler } from '../handlers/messageHandler';

/**
 * Simple WebSocket client for connecting to Codebolt application
 */
export class CodeboltWebSocketClient {
  private websocket!: WebSocket;
  private config;
  private messageHandler: DockerProviderMessageHandler;
  private onDockerServerMessageCallback?: (message: Record<string, unknown>) => void;

  constructor(config) {
    this.config = config;
    this.messageHandler = new DockerProviderMessageHandler();
  }

  /**
   * Set callback for forwarding messages to Docker server
   */
  public setDockerServerCallback(callback: (message: Record<string, unknown>) => void): void {
    this.onDockerServerMessageCallback = callback;
    this.messageHandler.setDockerServerCallback(callback);
  }

  /**
   * Connect to Codebolt server
   */
  public async initializeWebSocket(): Promise<void> {
    const wsUrl = `ws://${this.config.serverUrl}:${this.config.socketPort}/codebolt?agentId=${this.config.agentId}&IS_PROVIDER=true&IS_REMOTE_PROVIDER=true&providerId=${this.config.providerId}&storedTaskId=${this.config.storedTaskId}`;
    console.log('[CodeboltWS] Connecting to:', wsUrl);
    
    this.websocket = new WebSocket(wsUrl);
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, this.config.connectionTimeout);

      this.websocket.on('open', () => {
        clearTimeout(timeout);
        console.log('[CodeboltWS] Connected');
        
        // Register as docker provider agent
        this.sendMessage({
          type: 'register',
          clientType: 'agent',
          agentType: 'docker-provider',
          agentId: this.config.agentId,
          providerId: this.config.providerId,
          storedTaskId: this.config.storedTaskId,
          agentTask: this.config.agentTask,
          isDev: this.config.isDev,
          serverUrl: this.config.serverUrl,
          socketPort: this.config.socketPort,
          IS_REMOTE_PROVIDER:true
        });
        
        resolve();
      });

      this.websocket.on('error', (error) => {
        clearTimeout(timeout);
        console.error('[CodeboltWS] Connection error:', error);
        reject(error);
      });

      this.websocket.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.messageHandler.handleMessage(message);
        } catch (error) {
          console.error('[CodeboltWS] Message parse error:', error);
        }
      });

      this.websocket.on('close', () => {
        console.log('[CodeboltWS] Connection closed');
      });
    });
  }

  /**
   * Send message to Codebolt server
   */
  public sendMessage(message: Record<string, unknown>): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message));
    }
  }

  /**
   * Send message from Docker server to Codebolt
   */
  public sendFromRemoteServer(message: Record<string, unknown>): void {
    this.sendMessage(message);
  }

  /**
   * Close connection
   */
  public close(): void {
    if (this.websocket) {
      this.websocket.close();
    }
  }
}