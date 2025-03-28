// services/signals/SignalService.ts
import EventEmitter from 'eventemitter3';

export type SignalHandler = (type: string, data: any) => void;

export class SignalService {
  private listeners = new Map<string, Set<SignalHandler>>();
  private events = new EventEmitter();
  
  registerListener(convId: string, handler: SignalHandler): () => void {
    if (!this.listeners.has(convId)) {
      this.listeners.set(convId, new Set());
    }
    this.listeners.get(convId)?.add(handler);
    console.log(`SignalService: Registered handler for conversation ${convId}`);
    return () => this.unregisterListener(convId, handler);
  }
  
  unregisterListener(convId: string, handler: SignalHandler): void {
    this.listeners.get(convId)?.delete(handler);
    console.log(`SignalService: Unregistered handler for conversation ${convId}`);
  }
  
  emitSignal(convId: string, type: string, data: any): void {
    console.log(`SignalService: Emitting signal ${type} for conversation ${convId}`);
    
    // Emit to specific conversation listeners
    this.listeners.get(convId)?.forEach(handler => {
      try {
        handler(type, data);
      } catch (error) {
        console.error(`Error in signal handler for conversation ${convId}:`, error);
      }
    });
    
    // Also emit events for pub/sub style usage
    this.events.emit(`signal:${convId}`, type, data);
    this.events.emit('signal', convId, type, data);
  }
  
  // Subscribe to all signals (useful for logging/debugging)
  onAnySignal(listener: (convId: string, type: string, data: any) => void): () => void {
    this.events.on('signal', listener);
    return () => this.events.off('signal', listener);
  }
  
  // Subscribe to signals for a specific conversation
  onConversationSignal(
    convId: string, 
    listener: (type: string, data: any) => void
  ): () => void {
    this.events.on(`signal:${convId}`, listener);
    return () => this.events.off(`signal:${convId}`, listener);
  }
}

// Singleton instance
let instance: SignalService | null = null;

export const getSignalService = (): SignalService => {
  if (!instance) {
    instance = new SignalService();
  }
  return instance;
};