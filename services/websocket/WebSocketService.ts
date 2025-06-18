// WebSocketService.ts
import EventEmitter from 'eventemitter3';
import Toast from 'react-native-toast-message';
import { getWsBaseUrl } from '../api/core/apiClient';
import { ChatConfigName, Message } from '@/types';

export type MessageCallback = (content: string) => void;
export type CompletionCallback = () => void;
export type TerminationCallback = (reason: string) => void;
export type ErrorCallback = (error: Error) => void;

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export type WebSocketSendMessage = 
  | { type: 'message', data: string }
  | { type: 'initialize', data: Message[] }
  | { type: string, [key: string]: any }
  | { message: string, [key: string]: any };
  
export type WebSocketReceiveMessage = 
  | { type: 'content', data: string }
  | { type: 'done', reason?: string }
  | { type: 'error', error: string };

let connectionCounter = 0;
  /**
 * Ephemeral WebSocket service - connects per message, disconnects after completion
 */
export class WebSocketService {
  private connectionId = ++connectionCounter;

  private socket: WebSocket | null = null;
  private events = new EventEmitter();
  private connectionState: ConnectionState = 'disconnected';
  private streamStartTime: number | null = null;
  private lastContentTime: number | null = null;
  private retryAttempts = 0;
  private maxRetries = 3;
  private retryDelays = [1000, 3000, 5000]; // 1s, 3s, 5s
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;
  
  /**
   * Connect and send complete message bundle
   */
  public async connectAndSend(
    configName: ChatConfigName, 
    conversationId: string, 
    payload: any
  ): Promise<void> {
    this.retryAttempts = 0;
    return this.attemptConnectionAndSend(configName, conversationId, payload);
  }

  private async attemptConnectionAndSend(
    configName: ChatConfigName,
    conversationId: string, 
    payload: any
  ): Promise<void> {
    try {
      await this.connect(configName, conversationId);
      this.sendMessage(payload);
    } catch (error) {
      await this.handleRetry(configName, conversationId, payload, error);
    }
  }

  private async handleRetry(
    configName: ChatConfigName,
    conversationId: string,
    payload: any,
    error: any
  ): Promise<void> {
    this.retryAttempts++;
    
    if (this.retryAttempts > this.maxRetries) {
      Toast.show({
        type: 'error',
        text1: 'Connection Failed',
        text2: 'Please check your network connection',
        visibilityTime: 5000
      });
      throw error;
    }

    const delay = this.retryDelays[this.retryAttempts - 1];
    const attemptText = this.retryAttempts === 1 ? 'Retrying connection...' : 
                      this.retryAttempts === 2 ? 'Still trying to connect...' : 
                      'Final connection attempt...';
    
    Toast.show({
      type: 'info',
      text1: 'Connection Issue',
      text2: attemptText,
      visibilityTime: 3000
    });

    this.retryTimeout = setTimeout(async () => {
      try {
        await this.attemptConnectionAndSend(configName, conversationId, payload);
      } catch (retryError) {
        // Will trigger another retry or final failure
      }
    }, delay);
  }

  private async connect(configName: ChatConfigName, conversationId: string): Promise<void> {
    this.cleanup();
    this.setConnectionState('connecting');
    
    const baseUrl = await getWsBaseUrl();
    const url = `${baseUrl}/${configName}/${conversationId}`;
    const connectionId = ++connectionCounter;
    
    this.socket = new WebSocket(url);
    this.streamStartTime = null;
    this.lastContentTime = null;
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);

      this.socket!.onopen = () => {
        clearTimeout(timeout);
        this.setConnectionState('connected');
        
console.log(`[ws_${connectionId.toString().padStart(2, '0')}] Connection established for ${configName}/${conversationId}`);

        resolve();
      };

      this.socket!.onclose = (event) => {
        clearTimeout(timeout);
        this.setConnectionState('disconnected');
        
        if (this.streamStartTime && !event.wasClean) {
          this.events.emit('terminated', 'connection_lost');
        }
        
        reject(new Error(`Connection closed: ${event.code}`));
      };

      this.socket!.onerror = () => {
        clearTimeout(timeout);
        this.setConnectionState('error');
        reject(new Error('WebSocket connection error'));
      };

      this.socket!.onmessage = (event) => {
        this.handleMessage(event);
      };
    });
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WebSocketReceiveMessage;
      const now = Date.now();
      
      switch (message.type) {
        case 'content':
          if (!this.streamStartTime) {
            this.streamStartTime = now;
          }
          this.lastContentTime = now;
          this.events.emit('message', message.data);
          break;
          
        case 'done':
          this.handleCompletion(message.reason);
          break;
          
        case 'error':
          this.events.emit('error', new Error(message.error));
          this.disconnect();
          break;
      }
    } catch (error) {
      this.events.emit('error', new Error('Failed to parse WebSocket message'));
    }
  }

  private handleCompletion(reason?: string): void {
    const now = Date.now();
    let wasTerminated = false;
    
    // Detect premature termination
    if (reason === 'token_limit' || reason === 'length_limit') {
      wasTerminated = true;
    } else if (this.streamStartTime && this.lastContentTime) {
      const streamDuration = now - this.streamStartTime;
      const timeSinceLastContent = now - this.lastContentTime;
      
      if (streamDuration < 500 || timeSinceLastContent > 5000) {
        wasTerminated = true;
        reason = reason || 'timeout';
      }
    }

    this.streamStartTime = null;
    this.lastContentTime = null;

    if (wasTerminated) {
      this.events.emit('terminated', reason || 'unknown');
    } else {
      this.events.emit('complete');
    }

    // Auto-disconnect after completion
    setTimeout(() => this.disconnect(), 100);
  }

  public sendMessage(payload: any): void {
    if (!this.isConnected()) {
      throw new Error('Cannot send message: not connected');
    }
    
    this.socket!.send(JSON.stringify(payload));
    console.log(`[ws_${this.connectionId.toString().padStart(2, '0')}] Sending ${JSON.stringify(payload).length} characters to WebSocket`);
  }

  public disconnect(): void {
    this.cleanup();
    this.setConnectionState('disconnected');
  }

  private cleanup(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    
    if (this.socket) {
      this.socket.close(1000, 'Normal closure');
      this.socket = null;
    }
    
    // Auto-cleanup: remove all event listeners
    this.events.removeAllListeners();
  }

  // Event registration
  public onMessage(callback: MessageCallback): () => void {
    this.events.on('message', callback);
    return () => this.events.off('message', callback);
  }

  public onComplete(callback: CompletionCallback): () => void {
    this.events.on('complete', callback);
    return () => this.events.off('complete', callback);
  }

  public onTerminated(callback: TerminationCallback): () => void {
    this.events.on('terminated', callback);
    return () => this.events.off('terminated', callback);
  }

  public onError(callback: ErrorCallback): () => void {
    this.events.on('error', callback);
    return () => this.events.off('error', callback);
  }

  // Status methods
  public isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
    }
  }
}

// Singleton instance
let webSocketServiceInstance: WebSocketService | null = null;

export const getWebSocketService = (): WebSocketService => {
  if (!webSocketServiceInstance) {
    webSocketServiceInstance = new WebSocketService();
  }
  return webSocketServiceInstance;
};

export const cleanup = (): void => {
  if (webSocketServiceInstance) {
    webSocketServiceInstance.disconnect();
    webSocketServiceInstance = null;
  }
};