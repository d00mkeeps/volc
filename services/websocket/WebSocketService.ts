import EventEmitter from 'eventemitter3';
import { getWsBaseUrl } from '../api/apiClient';
import { ChatConfigName, Message } from '@/types';

// Simplified types
export type MessageCallback = (content: string) => void;
export type CompletionCallback = () => void;
export type ConnectionStateChange = (state: ConnectionState) => void;
export type ErrorCallback = (error: Error) => void;

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

// Message types we'll send
export type WebSocketSendMessage = 
  | { type: 'message', data: string }
  | { type: 'initialize', data: Message[] };

// Message types we'll receive
export type WebSocketReceiveMessage = 
  | { type: 'content', data: string }
  | { type: 'done' }
  | { type: 'error', error: string }
  | { type: 'connection_status', data: 'connected' | 'disconnected' };

/**
 * WebSocketService - Simplified WebSocket service for chat messaging
 * 
 * This service handles WebSocket connections specifically for chat message streaming.
 * It provides a clean interface for:
 * - Connecting to chat conversations
 * - Sending messages
 * - Receiving streamed responses
 * - Monitoring connection state
 * 
 * Non-chat functionality (analysis, data visualization, etc.) has been moved to HTTP endpoints.
 */
export class WebSocketService {
  private socket: WebSocket | null = null;
  private events = new EventEmitter();
  private connectionState: ConnectionState = 'disconnected';
  private currentConversationId: string | null = null;
  private currentConfigName: ChatConfigName | null = null;
  private reconnectAttempts = 3;
  private reconnectInterval = 1000;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isReconnecting = false;
  
  /**
   * Connect to a specific conversation
   * @param configName The chat configuration type
   * @param conversationId The conversation identifier
   * @param messages Optional array of messages to initialize the conversation
   */
  public async connect(configName: ChatConfigName, conversationId: string, messages?: Message[]): Promise<void> {
    if (this.isConnected()) {
      this.disconnect();
    }
    
    this.setConnectionState('connecting');
    
    try {
      const baseUrl = await getWsBaseUrl();
      const url = `${baseUrl}/${configName}/${conversationId}`;
      
      console.log('WebSocketService: Connecting to', url);
      
      this.socket = new WebSocket(url);
      this.currentConversationId = conversationId;
      this.currentConfigName = configName;
      
      // Set up a connection timeout
      const connectionPromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);
        
        if (!this.socket) {
          clearTimeout(timeout);
          reject(new Error('Socket creation failed'));
          return;
        }
        
        this.socket.onopen = () => {
          clearTimeout(timeout);
          console.log('WebSocket connection opened');
          this.setConnectionState('connected');
          
          // Send initial messages if provided
          if (messages?.length) {
            this.sendInitialMessages(messages);
          }
          
          resolve();
        };
        
        this.socket.onclose = (event) => {
          clearTimeout(timeout);
          console.log('WebSocket closed:', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });
          this.setConnectionState('disconnected');
          reject(new Error('Connection closed'));
        };
        
        this.socket.onerror = (error) => {
          clearTimeout(timeout);
          console.error('WebSocket error:', error);
          this.setConnectionState('error');
          this.events.emit('error', new Error('WebSocket connection error'));
          reject(new Error('Connection error'));
        };
      });
      
      // Set up message handling
      if (this.socket) {
        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as WebSocketReceiveMessage;
            
            switch (message.type) {
              case 'content':
                this.events.emit('message', message.data);
                break;
              case 'done':
                this.events.emit('complete');
                break;
              case 'error':
                this.events.emit('error', new Error(message.error));
                break;
              case 'connection_status':
                if (message.data === 'connected') {
                  this.setConnectionState('connected');
                } else {
                  this.setConnectionState('disconnected');
                }
                break;
              default:
                console.warn('Unknown message type:', message);
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
            this.events.emit('error', new Error('Failed to parse WebSocket message'));
          }
        };
      }
      
      // Wait for connection to be established
      await connectionPromise;
      
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.setConnectionState('error');
      throw error;
    }
  }
  
  /**
   * Disconnect from the current conversation
   */
  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this.currentConversationId = null;
    this.currentConfigName = null;
    this.setConnectionState('disconnected');
  }
  
  /**
   * Send a message to the current conversation
   * @param content The message content
   */
  public sendMessage(content: string): void {
    if (!this.isConnected()) {
      throw new Error('Cannot send message: not connected');
    }
    
    const payload: WebSocketSendMessage = {
      type: 'message',
      data: content
    };
    
    this.socket!.send(JSON.stringify(payload));
    console.log('Message sent:', content.substring(0, 50) + (content.length > 50 ? '...' : ''));
  }
  
  /**
   * Send conversation history
   * @param messages Array of messages to initialize the conversation
   */
  public sendInitialMessages(messages: Message[]): void {
    if (!this.isConnected()) {
      throw new Error('Cannot send initial messages: not connected');
    }
    
    const payload: WebSocketSendMessage = {
      type: 'initialize',
      data: messages
    };
    
    this.socket!.send(JSON.stringify(payload));
    console.log('Sent conversation history:', messages.length, 'messages');
  }
  
  /**
   * Attempt to reconnect after connection failure
   */
  public async reconnect(): Promise<void> {
    if (this.isReconnecting || this.isConnected()) return;
    
    this.isReconnecting = true;
    
    // Only reconnect if we have connection info
    const connectionInfo = this.getCurrentConnectionInfo();
    if (!connectionInfo) {
      this.isReconnecting = false;
      return;
    }
    
    console.log('Attempting to reconnect...');
    
    let attempts = 0;
    while (attempts < this.reconnectAttempts) {
      try {
        await this.connect(connectionInfo.configName, connectionInfo.conversationId);
        console.log('Reconnection successful');
        break;
      } catch (error) {
        console.error(`Reconnection attempt ${attempts + 1} failed:`, error);
        attempts++;
        
        if (attempts < this.reconnectAttempts) {
          // Exponential backoff
          const delay = this.reconnectInterval * Math.pow(2, attempts - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    this.isReconnecting = false;
    
    if (!this.isConnected() && attempts >= this.reconnectAttempts) {
      console.log('Maximum reconnection attempts reached');
      this.reconnectTimeout = setTimeout(() => this.reconnect(), 60000); // Try again after a minute
    }
  }
  
  /**
   * Register a callback for message content chunks
   * @param callback Function to call with each content chunk
   * @returns Function to unregister the callback
   */
  public onMessage(callback: MessageCallback): () => void {
    this.events.on('message', callback);
    return () => this.events.off('message', callback);
  }
  
  /**
   * Register a callback for message completion events
   * @param callback Function to call when a message is complete
   * @returns Function to unregister the callback
   */
  public onComplete(callback: CompletionCallback): () => void {
    this.events.on('complete', callback);
    return () => this.events.off('complete', callback);
  }
  
  /**
   * Register a callback for connection state changes
   * @param callback Function to call when connection state changes
   * @returns Function to unregister the callback
   */
  public onConnectionStateChange(callback: ConnectionStateChange): () => void {
    this.events.on('connectionStateChange', callback);
    return () => this.events.off('connectionStateChange', callback);
  }
  
  /**
   * Register a callback for error events
   * @param callback Function to call when an error occurs
   * @returns Function to unregister the callback
   */
  public onError(callback: ErrorCallback): () => void {
    this.events.on('error', callback);
    return () => this.events.off('error', callback);
  }
  
  /**
   * Get the current connection state
   * @returns The connection state
   */
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }
  
  /**
   * Get information about the current connection
   * @returns Connection information or null if not connected
   */
  public getCurrentConnectionInfo(): { configName: ChatConfigName, conversationId: string } | null {
    if (this.currentConfigName && this.currentConversationId) {
      return {
        configName: this.currentConfigName,
        conversationId: this.currentConversationId
      };
    }
    return null;
  }
  
  /**
   * Check if currently connected
   * @returns True if connected, false otherwise
   */
  public isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
  
  /**
   * Update connection state and notify listeners
   * @param state The new connection state
   */
  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.events.emit('connectionStateChange', state);
      console.log('WebSocket connection state changed:', state);
    }
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();