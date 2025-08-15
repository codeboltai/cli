/**
 * Message handler for Docker Provider Agent
 */
export class DockerProviderMessageHandler {
  private onMessageToDockerServer?: (message: Record<string, unknown>) => void;
  
  /**
   * Set callback for forwarding messages to Docker server
   */
  setDockerServerCallback(callback: (message: Record<string, unknown>) => void): void {
    this.onMessageToDockerServer = callback;
  }
  
  /**
   * Handle incoming messages from the Codebolt server
   */
  handleMessage(message: unknown): void {
    try {
      console.log('[MessageHandler] Received message:', JSON.stringify(message, null, 2));
      
      if (typeof message === 'object' && message !== null && 'type' in message) {
        const typedMessage = message as { type: string; [key: string]: unknown };
        
        switch (typedMessage.type) {
          case 'connection':
            this.handleConnectionMessage(typedMessage);
            break;
          case 'registered':
            this.handleRegisteredMessage(typedMessage);
            break;
          case 'response':
            this.handleResponseMessage(typedMessage);
            break;
          case 'readfile':
          case 'writefile':
          case 'askAI':
          case 'custom-operation':
            // Forward agent-targeted messages to Docker server
            this.forwardToDockerServer(typedMessage);
            break;
          default:
            console.log('[MessageHandler] Unknown message type:', typedMessage.type);
        }
      } else {
        console.warn('[MessageHandler] Invalid message format:', message);
      }
    } catch (error) {
      console.error('[MessageHandler] Error handling message:', error);
    }
  }

  /**
   * Forward message to Docker server
   */
  private forwardToDockerServer(message: { type: string; [key: string]: unknown }): void {
    console.log('[MessageHandler] Forwarding message to Docker server:', message.type);
    
    if (this.onMessageToDockerServer) {
      this.onMessageToDockerServer(message);
    } else {
      console.warn('[MessageHandler] No Docker server callback configured - cannot forward message');
    }
  }

  /**
   * Handle connection establishment message
   */
  private handleConnectionMessage(message: { type: string; [key: string]: unknown }): void {
    console.log('[MessageHandler] Connection message received:', message);
  }

  /**
   * Handle registration confirmation message
   */
  private handleRegisteredMessage(message: { type: string; [key: string]: unknown }): void {
    console.log('[MessageHandler] Agent registered successfully:', message);
  }

  /**
   * Handle response messages
   */
  private handleResponseMessage(message: { type: string; [key: string]: unknown }): void {
    console.log('[MessageHandler] Response received:', message);
  }

  /**
   * Handle read file requests
   */
  private handleReadFileRequest(message: { type: string; [key: string]: unknown }): void {
    console.log('[MessageHandler] Read file request:', message);
    // Docker provider agents might handle file operations differently
    // This is a placeholder for Docker-specific file handling
  }

  /**
   * Handle write file requests
   */
  private handleWriteFileRequest(message: { type: string; [key: string]: unknown }): void {
    console.log('[MessageHandler] Write file request:', message);
    // Docker provider agents might handle file operations differently
    // This is a placeholder for Docker-specific file handling
  }

  /**
   * Handle AI requests
   */
  private handleAskAIRequest(message: { type: string; [key: string]: unknown }): void {
    console.log('[MessageHandler] AI request:', message);
    // Docker provider agents might have specific AI handling logic
  }

  /**
   * Handle custom operations
   */
  private handleCustomOperation(message: { type: string; [key: string]: unknown }): void {
    console.log('[MessageHandler] Custom operation:', message);
    // Handle Docker-specific operations here
  }
}
