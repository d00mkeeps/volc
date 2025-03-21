import EventEmitter from 'eventemitter3';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uuidv4 } from '@/utils/uuid';
import { 
  WebSocketEvents,
  ChatConfigName, 
  WebSocketMessage
} from '@/types/index';
import { getLocalIpAddress } from '@/utils/network';
import { Message } from '@/types';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

// New types for the queue system
export type MessagePriority = 'high' | 'normal' | 'low';

export interface QueuedMessage {
  id: string;
  payload: WebSocketMessage;
  timestamp: number;
  retryCount: number;
  priority: MessagePriority;
  persistent: boolean;
}

export type QueueEvents = {
  'queueEmpty': () => void;
  'queueProcessing': () => void;
  'queueSizeChanged': (size: number) => void;
  'queueItemFailed': (item: QueuedMessage) => void;
  'queueItemRetry': (item: QueuedMessage) => void;
  'queueItemSuccess': (item: QueuedMessage) => void;
  'queueStateChanged': (state: QueueState) => void;
};

export interface QueueState {
  size: number;
  oldestMessageAge: number | null;
  priorityCounts: Record<MessagePriority, number>;
  isProcessing: boolean;
  failedCount: number;
}

export class WebSocketService {
  // Original properties
  private currentMessages: Message[] | null = null;
  private socket: WebSocket | null = null;
  private events: EventEmitter<WebSocketEvents> = new EventEmitter();
  private baseUrl: string | null = null;
  private readonly reconnectAttempts = 3;
  private readonly reconnectInterval = 1000;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private readonly BASE_PATH = '/';
  private isConnecting: boolean = false;
  private isConnectionReady = false;
  private isReconnecting: boolean = false;
  
  // Heartbeat properties
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private missedHeartbeats: number = 0;
  private readonly MAX_MISSED_HEARTBEATS = 3;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds

  // Enhanced message queue properties
  private queueEvents: EventEmitter<QueueEvents> = new EventEmitter();
  private messageQueue: QueuedMessage[] = [];
  private failedMessages: QueuedMessage[] = [];
  private processingQueue: boolean = false;
  private queueProcessingTimeout: NodeJS.Timeout | null = null;
  
  // Configuration for the queue system
  private readonly QUEUE_STORAGE_KEY = '@WebSocketQueue';
  private readonly QUEUE_PROCESS_BATCH_SIZE = 5;
  private readonly QUEUE_PROCESS_INTERVAL = 200; // ms
  private readonly MAX_RETRY_ATTEMPTS = 5;
  private readonly RETRY_BACKOFF_FACTOR = 1.5;
  private enableQueuePersistence: boolean = false;
  private lastNetworkType: string | null = null;
  private appState: 'active' | 'background' | 'inactive' = 'active';

  //connection registry
  private connectionRegistry = new Map<string, {refCount: number, configName: string, id: string}>();
private getConnectionKey = (configName: string, id: string): string => `${configName}:${id}`;

  /**
   * Initialize the WebSocket service with optional queue persistence
   */
  public async initialize(enableQueuePersistence: boolean = false): Promise<void> {
    this.baseUrl = await getLocalIpAddress();
    this.enableQueuePersistence = enableQueuePersistence;
    
    // Register app state listener for React Native
    this.setupAppStateListener();
    this.setupNetworkChangeListener();
    
    // Load any persisted messages
    if (this.enableQueuePersistence) {
      await this.loadPersistedQueue();
    }
    
    console.log('WebSocketService initialized with queue persistence:', enableQueuePersistence);
  }
  
  /**
   * Set up listeners for app state changes (foreground/background)
   */
  private setupAppStateListener(): void {
    try {
      const { AppState } = require('react-native');
      AppState.addEventListener('change', (nextAppState: string) => {
        console.log('App state changed to:', nextAppState);
        
        // Update internal app state
        this.appState = nextAppState as any;
        
        // If app comes to foreground and we have queued messages, try to process them
        if (nextAppState === 'active' && this.messageQueue.length > 0) {
          console.log('App resumed with queued messages, attempting to process');
          this.reconnect();
        }
      });
    } catch (error) {
      console.warn('Could not set up app state listener:', error);
    }
  }
  
  /**
   * Set up listeners for network changes
   */
  private setupNetworkChangeListener(): void {
    try {
      // Add proper type annotation for state
      NetInfo.addEventListener((state: NetInfoState) => {
        const currentNetworkType = state.type;
        
        // If network type changed (e.g., WiFi to cellular)
        if (this.lastNetworkType && this.lastNetworkType !== currentNetworkType) {
          console.log(`Network changed from ${this.lastNetworkType} to ${currentNetworkType}`);
          
          // If we're connected to a network and have queued messages, try to reconnect
          if (state.isConnected && this.messageQueue.length > 0) {
            console.log('Network changed with queued messages, attempting to reconnect');
            this.reconnect();
          }
        }
        
        this.lastNetworkType = currentNetworkType;
      });
    } catch (error) {
      console.warn('Could not set up network change listener:', error);
    }
  }

  /**
   * Get information about the current connection
   */
  public getCurrentConnectionInfo() {
    if (this.socket && this.isConnected()) {
      // Find the active connection in the registry
      for (const [key, entry] of this.connectionRegistry.entries()) {
        return {
          configName: entry.configName,
          id: entry.id,
          messages: this.currentMessages || undefined
        };
      }
    }
    return null;
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.missedHeartbeats = 0;
    
    console.log(`Started heartbeat interval (every ${this.HEARTBEAT_INTERVAL / 1000}s)`);
    
    this.heartbeatInterval = setInterval(() => {
      if (!this.isConnected()) {
        this.missedHeartbeats++;
        console.log(`Heartbeat failed, connection not open (missed: ${this.missedHeartbeats})`);
        
        if (this.missedHeartbeats >= this.MAX_MISSED_HEARTBEATS) {
          console.log('Too many missed heartbeats, reconnecting...');
          this.reconnect();
        }
        return;
      }
      
      try {
        // Send a ping message with low priority (doesn't need to be persisted)
        this.sendMessage({ 
          type: 'heartbeat', 
          timestamp: new Date().toISOString() 
        }, 'low', false);
        console.log('Heartbeat sent');
      } catch (error) {
        console.error('Failed to send heartbeat:', error);
        this.missedHeartbeats++;
        
        if (this.missedHeartbeats >= this.MAX_MISSED_HEARTBEATS) {
          console.log('Too many missed heartbeats, reconnecting...');
          this.reconnect();
        }
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      console.log('Heartbeat stopped');
    }
    this.missedHeartbeats = 0;
  }

  private sendInitialMessages(messages: Message[]): void {
    console.log('Sending conversation history:', messages.length, 'messages');
    this.sendMessage({
      type: 'initialize',
      data: messages  // Put the messages in the data field instead
    }, 'high', true); // High priority, persistent (important for reconnection)
  }
  /**
   * Connect to the WebSocket server
   */
  public async connect(configName: ChatConfigName, id: string, messages?: Message[]): Promise<void> {
    const connectionKey = this.getConnectionKey(configName, id);
    
    if (this.isConnected() && this.connectionRegistry.has(connectionKey)) {
      console.log(`Reusing existing connection: ${connectionKey}`);
      const entry = this.connectionRegistry.get(connectionKey)!;
      this.connectionRegistry.set(connectionKey, {...entry, refCount: entry.refCount + 1});
      this.events.emit('connect');
      return;
    }
  
    if (this.isConnecting) {
      console.log('Connection in progress, waiting...');
      await new Promise(resolve => setTimeout(resolve, 500));
      if (this.isConnecting) {
        console.log('Connection still in progress after wait, returning');
        return;
      }
    }
  
    this.disconnect();
    this.isConnecting = true;
    this.isConnectionReady = false;
    
    try {
      if (!this.baseUrl) {
        await this.initialize();
      }
  
      // Build WebSocket URL
      let url;
      switch (configName) {
        case 'base':
          url = `ws://${this.baseUrl}:8000/base/${id}`;
          break;
        case 'onboarding':
          url = `ws://${this.baseUrl}:8000/onboarding`;
          break;
        case 'workout-analysis':
        case 'default':
          url = `ws://${this.baseUrl}:8000/${configName}/${id}`;
          break;
        default:
          throw new Error('Invalid chat configuration');
      }
  
      console.log('WebSocketService: Attempting connection to:', url);
      this.socket = new WebSocket(url);
  
      // Return a promise that resolves when connection is fully ready
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);
  
        this.socket!.onopen = () => {
          console.log('WebSocket connection opened');
          this.startHeartbeat();
        };
  
        this.socket!.onclose = (event) => {
          clearTimeout(timeout);
          console.log('WebSocket closed:', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });
          this.stopHeartbeat();
          this.events.emit('disconnect');
          this.isConnectionReady = false;
          this.isConnecting = false;
          
          reject(new Error('Connection closed before initialization'));
        };
  
        this.socket!.onmessage = (event: MessageEvent) => {
          try {
            let message = typeof event.data === 'string' ? JSON.parse(event.data) : JSON.parse(JSON.stringify(event.data));
  
            // Handle heartbeat response
            if (message.type === 'heartbeat_ack') {
              this.missedHeartbeats = 0;
              console.log('Heartbeat acknowledged');
              return; // Don't process further or emit event
            }
            
            if (message.type === 'connection_status' && message.data === 'connected') {
              this.isConnectionReady = true;
              this.isConnecting = false;
              this.events.emit('connect');
              
              if (messages?.length) {
                this.sendInitialMessages(messages);
              }
              
              // Process any queued messages
              this.processQueue();
              
              clearTimeout(timeout);
              resolve();
            }
            
            this.events.emit('message', message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
            this.handleError(new Error('Failed to parse WebSocket message'));
          }
        };
  
        this.socket!.onerror = (event) => {
          clearTimeout(timeout);
          console.error('WebSocket connection error:', event);
          this.stopHeartbeat();
          this.isConnecting = false;
          const error = new Error('WebSocket connection error');
          this.handleError(error);
          reject(error);
        };
      });
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.isConnecting = false;
      this.handleError(error as Error);
      throw error;
    } finally {
      this.connectionRegistry.set(connectionKey, {refCount: 1, configName, id});
    }
  }

  public disconnectFrom(configName: string, id: string): void {
    const connectionKey = this.getConnectionKey(configName, id);
    
    if (this.connectionRegistry.has(connectionKey)) {
      const entry = this.connectionRegistry.get(connectionKey)!;
      
      if (entry.refCount > 1) {
        this.connectionRegistry.set(connectionKey, {...entry, refCount: entry.refCount - 1});
      } else {
        this.connectionRegistry.delete(connectionKey);
        this.disconnect();
      }
    }
  }

  /**
   * Send a message with optional priority and persistence
   * Returns a unique message ID for tracking
   */
  public sendMessage(
    payload: WebSocketMessage, 
    priority: MessagePriority = 'normal',
    persistent: boolean = false
  ): string {
    const messageId = uuidv4();
    
    // Create queued message object
    const queuedMessage: QueuedMessage = {
      id: messageId,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      priority,
      persistent
    };
    
    console.log(`Queuing message (${priority} priority, ${persistent ? 'persistent' : 'non-persistent'}):`, {
      id: messageId,
      type: payload.type
    });
    
    // Add to queue
    this.addToQueue(queuedMessage);
    
    // If connected, start processing the queue
    if (this.isConnected() && this.isConnectionReady) {
      this.processQueue();
    } else {
      console.log('Socket not connected, message queued for later delivery');
      this.reconnect();
    }
    
    return messageId; // Return ID so caller can track this message
  }
  
  /**
   * Add a message to the queue, maintaining priority order
   */
  private addToQueue(message: QueuedMessage): void {
    // Add to queue
    this.messageQueue.push(message);
    
    // Sort by priority (high > normal > low) and then by timestamp (oldest first)
    this.messageQueue.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      
      // First compare by priority
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // If same priority, compare by timestamp (oldest first)
      return a.timestamp - b.timestamp;
    });
    
    // Update queue state
    this.updateQueueState();
    
    // If the message is persistent, save the queue
    if (message.persistent && this.enableQueuePersistence) {
      this.persistQueue();
    }
  }
  
  /**
   * Send a message immediately without queueing
   */
  private async sendMessageImmediate(queuedMessage: QueuedMessage): Promise<boolean> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocket not ready:', {
        socketExists: !!this.socket,
        readyState: this.socket?.readyState,
        openState: WebSocket.OPEN,
        payloadType: queuedMessage.payload.type
      });
      return false;
    }
  
    try {
      // Log message details before sending
      console.log('📤 Sending WebSocket message:', {
        id: queuedMessage.id,
        type: queuedMessage.payload.type,
        priority: queuedMessage.priority,
        retryCount: queuedMessage.retryCount,
        age: Math.round((Date.now() - queuedMessage.timestamp) / 1000) + 's'
      });
      
      const serialized = JSON.stringify(queuedMessage.payload);
      this.socket.send(serialized);
      console.log('✅ WebSocket message sent successfully:', queuedMessage.id);
      
      // Emit events
      this.events.emit('messageSent', queuedMessage.payload);
      this.queueEvents.emit('queueItemSuccess', queuedMessage);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      this.handleError(new Error(`Failed to send message: ${error}`));
      
      // Emit failure event
      this.queueEvents.emit('queueItemFailed', queuedMessage);
      
      return false;
    }
  }
  
  /**
   * Process the message queue
   */
  private processQueue(): void {
    // If already processing or no messages, skip
    if (this.processingQueue || this.messageQueue.length === 0) {
      return;
    }
    
    // If not connected, don't attempt to process
    if (!this.isConnected() || !this.isConnectionReady) {
      console.log('Cannot process queue: not connected');
      return;
    }
    
    this.processingQueue = true;
    this.queueEvents.emit('queueProcessing');
    this.updateQueueState();
    
    console.log(`Processing message queue (${this.messageQueue.length} items)`);
    
    // Get a batch of messages to process
    const batch = this.messageQueue.splice(0, this.QUEUE_PROCESS_BATCH_SIZE);
    
    // Process each message in the batch
    const processBatch = async () => {
      for (const message of batch) {
        // Try to send the message
        const success = await this.sendMessageImmediate(message);
        
        if (!success) {
          // Handle retry logic
          if (message.retryCount < this.MAX_RETRY_ATTEMPTS) {
            // Increment retry count
            message.retryCount++;
            
            // Calculate backoff delay using exponential backoff
            const backoffDelay = this.calculateBackoffDelay(message.retryCount);
            
            console.log(`Scheduling retry ${message.retryCount}/${this.MAX_RETRY_ATTEMPTS} ` +
                       `for message ${message.id} in ${backoffDelay}ms`);
            
            // Re-queue the message with a timeout to respect backoff
            setTimeout(() => {
              this.queueEvents.emit('queueItemRetry', message);
              this.addToQueue(message);
            }, backoffDelay);
          } else {
            // Max retries reached, move to failed messages
            console.error(`Message ${message.id} failed after ${this.MAX_RETRY_ATTEMPTS} attempts`);
            this.failedMessages.push(message);
            this.updateQueueState();
          }
        } else if (message.persistent && this.enableQueuePersistence) {
          // Message was successfully sent, remove from persisted storage if needed
          await this.removePersistedMessage(message.id);
        }
      }
      
      // After processing the batch
      this.processingQueue = false;
      this.updateQueueState();
      
      // If there are more messages, schedule the next batch
      if (this.messageQueue.length > 0) {
        this.queueProcessingTimeout = setTimeout(() => this.processQueue(), this.QUEUE_PROCESS_INTERVAL);
      } else {
        // Queue is empty
        this.queueEvents.emit('queueEmpty');
      }
    };
    
    processBatch();
  }
  
  /**
   * Calculate backoff delay for retries using exponential backoff
   */
  private calculateBackoffDelay(retryCount: number): number {
    // Base delay (1 second) with exponential backoff and a bit of jitter
    const baseDelay = 1000;
    const maxDelay = 30000; // Cap at 30 seconds
    
    // Calculate exponential backoff
    let delay = baseDelay * Math.pow(this.RETRY_BACKOFF_FACTOR, retryCount - 1);
    
    // Add a small random jitter (±10%)
    const jitter = delay * 0.1 * (Math.random() * 2 - 1);
    delay += jitter;
    
    // Cap at maximum delay
    return Math.min(delay, maxDelay);
  }

  /**
   * Persist the current queue to AsyncStorage
   */
  private async persistQueue(): Promise<void> {
    if (!this.enableQueuePersistence) return;
    
    try {
      // Filter for persistent messages only
      const persistentMessages = this.messageQueue.filter(msg => msg.persistent);
      
      if (persistentMessages.length === 0) {
        // No persistent messages, remove storage key
        await AsyncStorage.removeItem(this.QUEUE_STORAGE_KEY);
        return;
      }
      
      // Store the queue
      await AsyncStorage.setItem(
        this.QUEUE_STORAGE_KEY, 
        JSON.stringify(persistentMessages)
      );
      
      console.log(`Persisted ${persistentMessages.length} messages to storage`);
    } catch (error) {
      console.error('Failed to persist message queue:', error);
    }
  }
  
  /**
   * Load persisted queue from AsyncStorage
   */
  private async loadPersistedQueue(): Promise<void> {
    try {
      const storedQueue = await AsyncStorage.getItem(this.QUEUE_STORAGE_KEY);
      
      if (storedQueue) {
        const parsedQueue: QueuedMessage[] = JSON.parse(storedQueue);
        
        if (parsedQueue.length > 0) {
          console.log(`Recovered ${parsedQueue.length} messages from storage`);
          
          // Add recovered messages to the queue
          parsedQueue.forEach(message => this.addToQueue(message));
        }
      }
    } catch (error) {
      console.error('Failed to load persisted message queue:', error);
    }
  }
  
  /**
   * Remove a message from persisted storage after it's successfully sent
   */
  private async removePersistedMessage(messageId: string): Promise<void> {
    if (!this.enableQueuePersistence) return;
    
    try {
      const storedQueue = await AsyncStorage.getItem(this.QUEUE_STORAGE_KEY);
      
      if (storedQueue) {
        const parsedQueue: QueuedMessage[] = JSON.parse(storedQueue);
        const filteredQueue = parsedQueue.filter(msg => msg.id !== messageId);
        
        if (filteredQueue.length === 0) {
          // No more messages, remove the key
          await AsyncStorage.removeItem(this.QUEUE_STORAGE_KEY);
        } else {
          // Update with filtered queue
          await AsyncStorage.setItem(
            this.QUEUE_STORAGE_KEY,
            JSON.stringify(filteredQueue)
          );
        }
      }
    } catch (error) {
      console.error(`Failed to remove persisted message ${messageId}:`, error);
    }
  }
  
  /**
   * Clear the entire message queue
   */
  public clearQueue(): void {
    const queueSize = this.messageQueue.length;
    this.messageQueue = [];
    this.updateQueueState();
    
    if (queueSize > 0) {
      this.queueEvents.emit('queueEmpty');
    }
    
    // Clear persisted queue if enabled
    if (this.enableQueuePersistence) {
      AsyncStorage.removeItem(this.QUEUE_STORAGE_KEY)
        .catch(err => console.error('Failed to clear persisted queue:', err));
    }
    
    console.log(`Cleared message queue (${queueSize} items removed)`);
  }
  
  /**
   * Retry all failed messages
   */
  public retryFailedMessages(): void {
    if (this.failedMessages.length === 0) return;
    
    console.log(`Retrying ${this.failedMessages.length} failed messages`);
    
    // Reset retry count and add back to queue
    this.failedMessages.forEach(message => {
      message.retryCount = 0;
      this.addToQueue(message);
    });
    
    // Clear failed messages
    this.failedMessages = [];
    this.updateQueueState();
    
    // Start processing if connected
    if (this.isConnected()) {
      this.processQueue();
    }
  }
  
  /**
   * Update and emit queue state
   */
  private updateQueueState(): void {
    const state = this.getQueueState();
    this.queueEvents.emit('queueStateChanged', state);
    this.queueEvents.emit('queueSizeChanged', state.size);
  }
  
  /**
   * Get current queue state
   */
  private getQueueState(): QueueState {
    // Get oldest message age
    let oldestMessageAge = null;
    if (this.messageQueue.length > 0) {
      const oldestMessage = this.messageQueue.reduce(
        (oldest, current) => current.timestamp < oldest.timestamp ? current : oldest,
        this.messageQueue[0]
      );
      oldestMessageAge = Date.now() - oldestMessage.timestamp;
    }
    
    // Count messages by priority
    const priorityCounts = {
      high: this.messageQueue.filter(msg => msg.priority === 'high').length,
      normal: this.messageQueue.filter(msg => msg.priority === 'normal').length,
      low: this.messageQueue.filter(msg => msg.priority === 'low').length
    };
    
    return {
      size: this.messageQueue.length,
      oldestMessageAge,
      priorityCounts,
      isProcessing: this.processingQueue,
      failedCount: this.failedMessages.length
    };
  }
  
  /**
   * Get detailed queue statistics for monitoring
   */
  public getQueueStatistics() {
    const state = this.getQueueState();
    
    // Count messages by retry count
    const retryDistribution: Record<number, number> = {};
    this.messageQueue.forEach(msg => {
      retryDistribution[msg.retryCount] = (retryDistribution[msg.retryCount] || 0) + 1;
    });
    
    // Get message type distribution 
    const messageTypes: Record<string, number> = {};
    this.messageQueue.forEach(msg => {
      const type = msg.payload.type;
      messageTypes[type] = (messageTypes[type] || 0) + 1;
    });
    
    return {
      ...state,
      retryDistribution,
      messageTypes,
      isPersistenceEnabled: this.enableQueuePersistence,
      oldestMessageAgeFormatted: state.oldestMessageAge 
        ? this.formatDuration(state.oldestMessageAge) 
        : 'N/A'
    };
  }
  
  /**
   * Format duration in milliseconds to human-readable string
   */
  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.floor(ms / 1000)}s`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
  }
  
  /**
   * Subscribe to queue events
   */
  public onQueueEvent<K extends keyof QueueEvents>(
    event: K,
    listener: QueueEvents[K]
  ): void {
    this.queueEvents.on(event, listener as any);
  }
  
  /**
   * Unsubscribe from queue events
   */
  public offQueueEvent<K extends keyof QueueEvents>(
    event: K,
    listener: QueueEvents[K]
  ): void {
    this.queueEvents.off(event, listener as any);
  }

  /**
   * Handle WebSocket errors
   */
  private handleError(error: Error): void {
    console.error('WebSocket error:', error);
    this.events.emit('error', error);
  }

  /**
   * Disconnect and clean up resources
   */
  private async reconnect(): Promise<void> {
    if (this.isReconnecting) return;
    
    this.isReconnecting = true;
    this.events.emit('connecting');
    
    // Get current active connection from registry if exists
    let activeConnection = null;
    for (const [key, entry] of this.connectionRegistry.entries()) {
      activeConnection = entry;
      break; // Just get the first one for reconnection
    }
    
    if (!activeConnection) {
      this.isReconnecting = false;
      return;
    }
    
    let attempts = 0;
    while (attempts < this.reconnectAttempts && !this.isConnected()) {
      try {
        await this.connect(activeConnection.configName as ChatConfigName, activeConnection.id);
        console.log('Reconnection successful');
        break;
      } catch (error) {
        console.error(`Reconnection attempt ${attempts + 1} failed:`, error);
        attempts++;
        
        if (attempts < this.reconnectAttempts) {
          await new Promise(resolve => setTimeout(resolve, 
            this.reconnectInterval * Math.pow(2, attempts)));
        }
      }
    }
    
    this.isReconnecting = false;
    
    if (this.isConnected()) {
      this.processQueue();
    } else if (attempts >= this.reconnectAttempts) {
      this.reconnectTimeout = setTimeout(() => this.reconnect(), 60000);
    }
  }
  
  public disconnect(): void {
    // Stop timers
    this.stopHeartbeat();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.queueProcessingTimeout) {
      clearTimeout(this.queueProcessingTimeout);
      this.queueProcessingTimeout = null;
    }
    
    // Close socket
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  
    // Clear registry on full disconnect
    this.connectionRegistry.clear();
    this.processingQueue = false;
  }

  // Event handling for WebSocketEvents
  public on<K extends keyof WebSocketEvents>(
    event: K,
    listener: WebSocketEvents[K]
  ): this {
    this.events.on(event, listener as any);
    return this;
  }

  public off<K extends keyof WebSocketEvents>(
    event: K,
    listener: WebSocketEvents[K]
  ): this {
    this.events.off(event, listener as any);
    return this;
  }

  public isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}