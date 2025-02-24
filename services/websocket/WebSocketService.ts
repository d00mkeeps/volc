import EventEmitter from 'eventemitter3';
import { 
  WebSocketEvents,
  ChatConfigName, 
  WebSocketMessage
} from '@/types/index';
import { getLocalIpAddress } from '@/utils/network';
import { Message } from '@/types';

export class WebSocketService {
  private socket: WebSocket | null = null;
  private events: EventEmitter<WebSocketEvents> = new EventEmitter();
  private baseUrl: string | null = null;
  private readonly reconnectAttempts = 3;
  private readonly reconnectInterval = 1000;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private currentConfigName: ChatConfigName | null = null;
  private readonly BASE_PATH = '/api/llm/ws/';
  private currentConversationId: string | null = null
  private isConnecting: boolean = false;

  public async initialize(): Promise<void> {
    this.baseUrl = await getLocalIpAddress();
  }
  private sendInitialMessages(messages: Message[]): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.log('Socket not ready for initialization');
      return;
    }
  
    try {
      console.log('Sending conversation history:', messages);
      this.socket.send(JSON.stringify({
        type: 'initialize',
        messages
      }));
    } catch (error) {
      console.error('Failed to send initialization message:', error);
      this.handleError(error instanceof Error ? error : new Error('Failed to send initialization message'));
    }
  }

  public async connect(configName: ChatConfigName, conversationId?: string, messages?: Message[]): Promise<void> {
    // Add connection lock
    if (this.isConnecting) {
      console.log('Connection already in progress');
      return;
    }
    
    this.isConnecting = true;
    
    try {
      if (!this.baseUrl) {
        await this.initialize();
      }
  
      if (configName !== 'onboarding' && !conversationId) {
        throw new Error('Conversation ID required for non-onboarding chats');
      }
  
      // If already connected to the same conversation, just send messages
      if (this.socket?.readyState === WebSocket.OPEN) {
        if (this.currentConfigName === configName && this.currentConversationId === conversationId) {
          console.log('Already connected to this conversation');
          if (messages?.length) {
            this.sendInitialMessages(messages);
          }
          return;
        }
        // Different conversation, so disconnect first
        await this.disconnect();
      }
  
      this.currentConfigName = configName;
      this.currentConversationId = conversationId || null;
  
      // Build WebSocket URL
      let url;
      switch (configName) {
        case 'onboarding':
          url = `ws://${this.baseUrl}:8000${this.BASE_PATH}${configName}`;
          break;
        case 'workout-analysis':
          url = `ws://${this.baseUrl}:8000${this.BASE_PATH}workout-analysis`;
          break;
        case 'default':
          if (!conversationId) {
            throw new Error('Conversation ID required for default chat');
          }
          url = `ws://${this.baseUrl}:8000${this.BASE_PATH}default/${conversationId}`;
          break;
        default:
          throw new Error('Invalid chat configuration');
      }
  
      console.log('WebSocketService: Attempting connection to:', url);
      this.socket = new WebSocket(url);

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 5000);

        let hasReceivedConnectedStatus = false;

        this.socket!.onopen = () => {
          console.log('WebSocket connection opened');
        };

        this.socket!.onclose = (event) => {
          clearTimeout(timeout);
          console.log('WebSocket closed:', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });
          this.events.emit('disconnect');
          if (!hasReceivedConnectedStatus) {
            reject(new Error('Connection closed before initialization'));
          }
        };

        this.socket!.onmessage = (event: MessageEvent) => {
          try {
            let message = typeof event.data === 'string' ? JSON.parse(event.data) : JSON.parse(JSON.stringify(event.data));

            console.log('WebSocket raw message:', event.data);
            console.log('WebSocket parsed message:', {
              type: message.type,
              dataType: typeof message.data,
              dataLength: typeof message.data === 'string' ? message.data.length : 'N/A',
              dataIsEmpty: message.data === '',
              data: message.data
            });
            

            console.log('WebSocket received message:', message);
            
            if (message.type === 'connection_status' && message.data === 'connected') {
              hasReceivedConnectedStatus = true;
              this.events.emit('connect');
              
              if (messages?.length) {
                this.sendInitialMessages(messages);
              }
              
              clearTimeout(timeout);
              resolve();
            }
            
            this.events.emit('message', message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
            this.handleError(new Error('Failed to parse WebSocket message'));
          }
        };
      });
  
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleError(error as Error);
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }


  public sendMessage(payload: WebSocketMessage): void {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      this.handleError(new Error('WebSocket is not connected'));
      return;
    }

    try {
      console.log('WebSocketService sending:', payload);
      this.socket.send(JSON.stringify(payload));
    } catch (error) {
      console.error('Failed to send message:', error);
      this.handleError(new Error('Failed to send message'));
    }
  }

  private handleError(error: Error): void {
    console.error('WebSocket error:', error);
    this.events.emit('error', error);
  }

  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.currentConfigName = null;
    this.currentConversationId = null
  }

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