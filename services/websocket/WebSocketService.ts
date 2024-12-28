import EventEmitter from 'eventemitter3';
import { 
  WebSocketEvents,
  ChatConfigName 
} from '@/types/index';
import { getLocalIpAddress } from '@/utils/network';

export class WebSocketService {
  private socket: WebSocket | null = null;
  private events: EventEmitter<WebSocketEvents> = new EventEmitter();
  private baseUrl: string | null = null;
  private readonly reconnectAttempts = 3;
  private readonly reconnectInterval = 1000;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private currentConfigName: ChatConfigName | null = null;
  private readonly BASE_PATH = '/api/llm/ws/';

  public async initialize(): Promise<void> {
    this.baseUrl = await getLocalIpAddress();
  }

  public async connect(configName: ChatConfigName, conversationId?: string): Promise<void> {
    if (!this.baseUrl) {
      await this.initialize();
    }

    if (this.socket?.readyState === WebSocket.OPEN) {
      if (this.currentConfigName === configName) {
        console.log('Already connected with this config');
        return;
      }
      this.disconnect();
    }

    this.currentConfigName = configName;
    
    try {
      let url;
      if (configName === 'onboarding') {
        url = `ws://${this.baseUrl}:8000${this.BASE_PATH}${configName}`;
      } else if (conversationId) {
        url = `ws://${this.baseUrl}:8000${this.BASE_PATH}default/${conversationId}`;
      } else {
        throw new Error('Conversation ID required for non-onboarding chats');
      }

      console.log('WebSocketService: Attempting connection to:', url);
      this.socket = new WebSocket(url);
      this.attachEventHandlers();
    } catch (error) {
      console.log('WebSocket connection error:', error);
      this.handleError(error as Error);
    }
  }

  private attachEventHandlers(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log('WebSocket connection opened');
      this.events.emit('connect');
    };

    this.socket.onmessage = (event: MessageEvent) => {
      try {
        let message;
        if (typeof event.data === 'string') {
          message = JSON.parse(event.data);
        } else {
          message = JSON.parse(JSON.stringify(event.data));
        } 
        console.log('WebSocket received message:', message);

              // Handle connection status message
      if (message.type === 'connection_status' && message.data === 'connected') {
        this.events.emit('connect');  // Emit connect event again to ensure state update
      }
      
        this.events.emit('message', message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
        this.handleError(new Error('Failed to parse WebSocket message'));
      }
    };

    this.socket.onclose = (event) => {
      console.log('WebSocket closed:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      });
    };


    this.socket.onerror = (error) => {
  console.error('WebSocket error:', error);
};}

  private attemptReconnect(): void {
    if (!this.currentConfigName) return;
    
    if (this.reconnectAttempts >= this.reconnectAttempts) {
      this.handleError(new Error(`Max reconnection attempts (${this.reconnectAttempts}) reached`));
      return;
    }

    this.reconnectTimeout = setTimeout(() => {
      this.connect(this.currentConfigName!);
    }, this.reconnectInterval);
  }

  public sendMessage(payload: { message: string }): void {
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