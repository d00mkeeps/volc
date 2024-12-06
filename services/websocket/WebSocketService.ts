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

  public async connect(configName: ChatConfigName): Promise<void> {
    if (!this.baseUrl) {
      await this.initialize();
    }

    if (this.socket?.readyState === WebSocket.OPEN) {
      if (this.currentConfigName === configName) {
        return;
      }
      this.disconnect();
    }

    this.currentConfigName = configName;
    
    try {
      const url = `ws://${this.baseUrl}:8000${this.BASE_PATH}${configName}`;
      this.socket = new WebSocket(url);
      this.attachEventHandlers();
    } catch (error) {
      this.handleError(error as Error);
    }
  }


  private attachEventHandlers(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      this.events.emit('connect');
    };

    this.socket.onmessage = (event: MessageEvent) => {
      try {
        let message;
        //handle string and objects
        if (typeof event.data === 'string') {
          message = JSON.parse(event.data)
        } else {
          //if it's already an object, stringify and parse it
          message = JSON.parse(JSON.stringify(event.data))
        } 
        this.events.emit('message', message)
      } catch (error) {
        this.handleError(new Error('Failed to parse WebSocket message!'))
      }
      
    };

    this.socket.onclose = (event) => {
      this.events.emit('disconnect');
      if (!event.wasClean) {
        this.attemptReconnect();
      }
    };

    this.socket.onerror = (error) => {
      this.handleError(new Error('WebSocket error occurred'));
    };
  }

  private attemptReconnect(): void {
    if (!this.currentConfigName) return;
    
    if (this.reconnectAttempts >= this.reconnectAttempts) {
      this.handleError(new Error('Max reconnection attempts reached'));
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
      this.handleError(new Error('Failed to send message'));
  }
}

  private handleError(error: Error): void {
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