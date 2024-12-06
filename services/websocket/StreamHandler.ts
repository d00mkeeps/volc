import EventEmitter from 'eventemitter3';
import { WebSocketMessage } from '@/types/index';

type StreamEvents = {
  content: (data: string) => void;
  done: () => void;
  signal: (signal: { type: string; data: any }) => void;
  error: (error: Error) => void;
};

export class StreamHandler {
  private events: EventEmitter<StreamEvents> = new EventEmitter();

  public handleMessage(message: WebSocketMessage): void {
    try {
      switch (message.type) {
        case 'content':
          if (typeof message.data === 'string') {
            this.events.emit('content', message.data);
          } else {
            throw new Error('Invalid content data type');
          }
          break;
        
        case 'done':
          this.events.emit('done');
          break;
        
        case 'workout_history_approved':
          this.events.emit('signal', {
            type: 'workout_history_approved',
            data: message.data
          });
          break;

        case 'error':
          this.events.emit('error', new Error(message.error || 'Unknown error'));
          break;
          
        default:
          console.warn(`Unhandled message type: ${message.type}`);
      }
    } catch (error) {
      this.events.emit('error', error as Error);
    }
  }

  // Event listener methods
  public on<K extends keyof StreamEvents>(
    event: K,
    listener: StreamEvents[K]
  ): this {
    this.events.on(event, listener as any);
    return this;
  }

  public off<K extends keyof StreamEvents>(
    event: K,
    listener: StreamEvents[K]
  ): this {
    this.events.off(event, listener as any);
    return this;
  }
}