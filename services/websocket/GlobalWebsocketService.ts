// GlobalWebSocketService.ts

import { WebSocketService } from './WebSocketService';
import { ChatConfigName, Message } from '@/types';
import { ConversationService } from '@/services/supabase/conversation';

// Singleton instance
let instance: WebSocketService | null = null;

// Config cache to reduce database lookups
let configCache: Record<string, ChatConfigName> = {};

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

// Resolve configuration for a conversation
export const resolveConfig = async (conversationId: string): Promise<ChatConfigName> => {
  if (configCache[conversationId]) return configCache[conversationId];
  
  try {
    const conversationService = new ConversationService();
    const conversation = await conversationService.getConversation(conversationId);
    const config = conversation.config_name as ChatConfigName;
    configCache[conversationId] = config;
    return config;
  } catch (error) {
    console.error(`Failed to resolve config for ${conversationId}:`, error);
    return 'default';
  }
};

// Connect to a conversation with proper config
export const connectToConversation = async (
  conversationId: string, 
  messages?: Message[]
): Promise<void> => {
  const config = await resolveConfig(conversationId);
  return getWebSocketService().connect(config, conversationId, messages);
};

// Clean up a connection when component unmounts
export const releaseConnection = (configName: string, id: string): void => {
  getWebSocketService().disconnectFrom(configName, id);
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
        return instance.connect(configName as ChatConfigName, id, messages);
      }
    } catch (error) {
      console.error('Failed to reconnect', error);
    }
  }
};