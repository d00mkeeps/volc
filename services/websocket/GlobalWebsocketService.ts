// GlobalWebSocketService.ts

import { WebSocketService } from './WebSocketService';
import { ChatConfigName, Message } from '@/types';

// Singleton instance
let instance: WebSocketService | null = null;

// Getter function that instantiates if needed
export const getWebSocketService = (): WebSocketService => {
 if (!instance) {
   instance = new WebSocketService();
   instance.initialize();
 }
 return instance;
};

// Connection state tracking
export const isConnected = (): boolean => {
 return instance?.isConnected() || false;
};

// Base connection - for user-level notifications
export const connectBase = async (userId: string): Promise<void> => {
 const service = getWebSocketService();
 return service.connect('base', userId);
};

// Connect with conversation history
export const connectWithHistory = async (
 configName: ChatConfigName, 
 conversationId: string, 
 messages?: Message[]
): Promise<void> => {
 const service = getWebSocketService();
 return service.connect(configName, conversationId, messages);
};

// Cleanup function for logout/app termination
export const cleanup = (): void => {
 if (instance) {
   instance.disconnect();
   instance = null;
 }
};

export const reconnect = async (): Promise<void> => {
    if (instance && !instance.isConnected()) {
      try {
        // If we have stored connection info, try to reconnect
        const connectionInfo = instance.getCurrentConnectionInfo();
        if (connectionInfo) {
          const { configName, id, messages } = connectionInfo;
          return instance.connect(configName, id, messages);
        }
      } catch (error) {
        console.error('Failed to reconnect', error);
      }
    }
  };