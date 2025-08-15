import WebSocket from 'ws';


/**
 * Simple WebSocket client for connecting to Docker server in container
 */
export class RemoteEnvironmentWebSocketClient {
  private websocket?: WebSocket;
  private onMessageCallback?: (message: Record<string, unknown>) => void;

  /**
   * Set callback for handling messages from Docker server
   */
  public setMessageCallback(callback: (message: Record<string, unknown>) => void): void {
    this.onMessageCallback = callback;
  }
   /**
   * Connect to Docker server
   */
   public async connectToRemoteServer(): Promise<void> {
    const serverPort ='3001' //change remote server port
    const serverUrl = `ws://localhost:${serverPort}`;
    
    console.log('[DockerServerWS] Connecting to:', serverUrl);
    
    this.websocket = new WebSocket(serverUrl);
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout connecting to Docker server'));
      }, 30000);
      
      if (!this.websocket) {
        reject(new Error('Failed to create WebSocket'));
        return;
      }

      this.websocket.on('open', () => {
        clearTimeout(timeout);
        console.log('[DockerServerWS] Connected');
        
        // Register as client
        this.sendToRemoteEnvironmentServer({
          type: 'register',
          clientType: 'client'
        });
        
        resolve();
      });
      
      this.websocket.on('error', (error) => {
        clearTimeout(timeout);
        console.error('[DockerServerWS] Error:', error);
        reject(error);
      });
      
      this.websocket.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (this.onMessageCallback) {
            this.onMessageCallback(message);
          }
        } catch (error) {
          console.error('[DockerServerWS] Message parse error:', error);
        }
      });
      
      this.websocket.on('close', () => {
        console.log('[DockerServerWS] Connection closed');
        this.websocket = undefined;
      });
    });
  }

  /**
   * Send message to Docker server
   */
  public sendToRemoteEnvironmentServer(message: Record<string, unknown>): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message));
    } else {
      console.warn('[DockerServerWS] Cannot send - not connected');
    }
  }

  /**
   * Close connection
   */
  public close(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = undefined;
    }
  }

  

  /**
   * Check if connected
   */
  public get connected(): boolean {
    return this.websocket?.readyState === WebSocket.OPEN;
  }
}