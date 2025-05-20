// import { WebSocketService } from './WebSocketService';
// import { ChatConfigName, Message } from '@/types';
// import { ConversationService } from '@/services/db/conversation';
// import { WebSocketMessage } from '@/types/websocket';
// import { handlerManager } from './HandlerManager';

// export interface MessageContextHandlers {
//   handleContent: (content: string) => void;
//   handleLoadingStart: () => void;
//   handleLoadingDone: () => void;
//   handleStreamDone: () => void;
//   handleSignal: (type: string, data: any) => void;
// }

// export interface DataContextHandlers {
//   handleSignal: (type: string, data: any) => void;
// }

// // Singleton instance
// let instance: WebSocketService | null = null;

// // Config cache to reduce database lookups
// let configCache: Record<string, ChatConfigName> = {};

// // Modified to use HandlerManager and support context IDs
// export const registerContextHandlers = (
//   conversationId: string | null,
//   message: MessageContextHandlers | null,
//   data: DataContextHandlers | null
// ) => {
//   if (!conversationId) {
//     console.warn('registerContextHandlers called without conversationId');
//     return;
//   }
  
//   if (message) {
//     handlerManager.setMessageHandlers(conversationId, message);
//   }
  
//   if (data) {
//     handlerManager.setDataHandlers(conversationId, data);
//   }
  
//   console.log('Context handlers registered for conversation:', conversationId, {
//     messageHandlersPresent: !!message,
//     dataHandlersPresent: !!data
//   });
// };

// // Add a cleanup function for handler unregistration
// export const unregisterContextHandlers = (conversationId: string) => {
//   handlerManager.clearHandlers(conversationId);
//   console.log('Context handlers unregistered for conversation:', conversationId);
// };

// // Connection state tracking
// export const isConnected = (): boolean => {
//  return instance?.isConnected() || false;
// };

// // Resolve configuration for a conversation
// export const resolveConfig = async (conversationId: string): Promise<ChatConfigName> => {
//   if (configCache[conversationId]) return configCache[conversationId];
  
//   try {
//     const conversationService = new ConversationService();
//     const conversation = await conversationService.getConversation(conversationId);
//     const config = conversation.config_name as ChatConfigName;
//     configCache[conversationId] = config;
//     return config;
//   } catch (error) {
//     console.error(`Failed to resolve config for ${conversationId}:`, error);
//     return 'default';
//   }
// };

// // Connect to a conversation with proper config
// export const connectToConversation = async (
//   conversationId: string, 
//   messages?: Message[]
// ): Promise<void> => {
//   const config = await resolveConfig(conversationId);
//   return getWebSocketService().connect(config, conversationId, messages);
// };

// // Clean up a connection when component unmounts
// export const releaseConnection = (configName: string, id: string): void => {
//   getWebSocketService().disconnectFrom(configName, id);
// };

// // Base connection - for user-level notifications
// export const connectBase = async (userId: string): Promise<void> => {
//  const service = getWebSocketService();
//  return service.connect('base', userId);
// };

// // Connect with conversation history
// export const connectWithHistory = async (
//  configName: ChatConfigName, 
//  conversationId: string, 
//  messages?: Message[]
// ): Promise<void> => {
//  const service = getWebSocketService();
//  return service.connect(configName, conversationId, messages);
// };

// // Updated to delegate message handling to HandlerManager
// function setupMessageHandling(service: WebSocketService): void {
//   service.on('message', (message: WebSocketMessage) => {
//     // Delegate all message handling to the HandlerManager
//     handlerManager.handleWebSocketMessage(message);
//   });
// }

// // Cleanup function for logout/app termination
// export const cleanup = (): void => {
//  if (instance) {
//    instance.disconnect();
//    instance = null;
//  }
// };

// export const reconnect = async (): Promise<void> => {
//   if (instance && !instance.isConnected()) {
//     try {
//       // If we have stored connection info, try to reconnect
//       const connectionInfo = instance.getCurrentConnectionInfo();
//       if (connectionInfo) {
//         const { configName, id, messages } = connectionInfo;
//         return instance.connect(configName as ChatConfigName, id, messages);
//       }
//     } catch (error) {
//       console.error('Failed to reconnect', error);
//     }
//   }
// };

// // Get WebSocket service singleton instance
// export const getWebSocketService = (): WebSocketService => {
//   if (!instance) {
//     instance = new WebSocketService();
//     instance.initialize();
//     setupMessageHandling(instance);
//   }
//   return instance;
// };

// // Add function to get handler statistics for debugging
// export const getHandlerStats = () => {
//   return handlerManager.getHandlerStats();
// };