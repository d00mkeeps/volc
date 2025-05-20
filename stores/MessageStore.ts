// stores/MessageStore.ts
import { create } from 'zustand';
import { conversationService } from '../services/db/conversation';
import { Message } from '@/types';
import { getWebSocketService } from '../services/websocket/GlobalWebsocketService';
import { ChatConfigName } from '@/types';

// Type for streaming message state
interface StreamingMessageState {
  conversationId: string;
  content: string;
  isComplete: boolean;
}

// MessageStore state and actions
interface MessageStoreState {
  // State
  messages: Map<string, Message[]>; // conversationId -> messages[]
  streamingMessage: StreamingMessageState | null;
  isLoading: boolean;
  error: Error | null;
  
  // Basic message operations
  getMessages: (conversationId: string) => Message[];
  loadMessages: (conversationId: string) => Promise<Message[]>;
  addUserMessage: (conversationId: string, content: string) => Promise<Message>;
  addAssistantMessage: (conversationId: string, content: string) => Promise<Message>;
  clearMessages: (conversationId: string) => void;
  
  // WebSocket integration
  connectToConversation: (
    conversationId: string, 
    configName: ChatConfigName, 
    messages?: Message[]
  ) => Promise<() => void>;
  
  sendMessage: (
    conversationId: string, 
    content: string, 
    options?: { detailedAnalysis?: boolean; analysisBundle?: any }
  ) => Promise<void>;
  
  // Utility methods
  clearError: () => void;
}

export const useMessageStore = create<MessageStoreState>((set, get) => ({
  // Initial state
  messages: new Map(),
  streamingMessage: null,
  isLoading: false,
  error: null,
  
  // Get messages for a conversation from local state
  getMessages: (conversationId) => {
    return get().messages.get(conversationId) || [];
  },
  
  // Load messages from server
  loadMessages: async (conversationId) => {
    try {
      set({ isLoading: true, error: null });
      
      // Get messages from API
      const messages = await conversationService.getConversationMessages(conversationId);
      
      // Update state
      set((state) => {
        const newMessages = new Map(state.messages);
        newMessages.set(conversationId, messages);
        
        return {
          messages: newMessages,
          isLoading: false
        };
      });
      
      return messages;
    } catch (error) {
      console.error('[MessageStore] Error loading messages:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error))
      });
      throw error;
    }
  },
  
  // Add a user message
  addUserMessage: async (conversationId, content) => {
    try {
      // Save message to database
      const message = await conversationService.saveMessage({
        conversationId,
        content,
        sender: 'user'
      });
      
      // Update state
      set((state) => {
        const conversationMessages = state.messages.get(conversationId) || [];
        const newMessages = new Map(state.messages);
        newMessages.set(conversationId, [...conversationMessages, message]);
        
        return { messages: newMessages };
      });
      
      return message;
    } catch (error) {
      console.error('[MessageStore] Error adding user message:', error);
      set({
        error: error instanceof Error ? error : new Error(String(error))
      });
      throw error;
    }
  },
  
  // Add an assistant message
  addAssistantMessage: async (conversationId, content) => {
    try {
      // Save message to database
      const message = await conversationService.saveMessage({
        conversationId,
        content,
        sender: 'assistant'
      });
      
      // Update state
      set((state) => {
        const conversationMessages = state.messages.get(conversationId) || [];
        const newMessages = new Map(state.messages);
        newMessages.set(conversationId, [...conversationMessages, message]);
        
        return { messages: newMessages };
      });
      
      return message;
    } catch (error) {
      console.error('[MessageStore] Error adding assistant message:', error);
      set({
        error: error instanceof Error ? error : new Error(String(error))
      });
      throw error;
    }
  },
  
  // Clear messages for a conversation
  clearMessages: (conversationId) => {
    set((state) => {
      const newMessages = new Map(state.messages);
      newMessages.set(conversationId, []);
      return { messages: newMessages };
    });
  },
  
  // Clear error
  clearError: () => {
    set({ error: null });
  },
  
  // Connect to a conversation WebSocket
  connectToConversation: async (conversationId, configName, messages = []) => {
    const webSocketService = getWebSocketService();
    const unsubscribeFunctions: (() => void)[] = [];
    
    try {
      console.log(`[MessageStore] Connecting to conversation: ${conversationId} with config: ${configName}`);
      
      // Set up message content handler
      const contentHandler = (content: string) => {
        const { streamingMessage } = get();
        
        // If this is the first content chunk, start a new streaming message
        if (!streamingMessage || streamingMessage.conversationId !== conversationId) {
          console.log(`[MessageStore] Starting streaming message for conversation: ${conversationId}`);
          set({
            streamingMessage: {
              conversationId,
              content,
              isComplete: false
            }
          });
        } else {
          // Append to existing streaming message
          set((state) => ({
            streamingMessage: {
              ...state.streamingMessage!,
              content: state.streamingMessage!.content + content
            }
          }));
        }
      };
      
      // Set up completion handler
      const completeHandler = async () => {
        const { streamingMessage } = get();
        
        if (streamingMessage && streamingMessage.conversationId === conversationId && streamingMessage.content) {
          console.log(`[MessageStore] Completing streaming message for conversation: ${conversationId}`);
          
          // Mark as complete to prevent duplicate processing
          set((state) => ({
            streamingMessage: {
              ...state.streamingMessage!,
              isComplete: true
            }
          }));
          
          try {
            // Save the complete message
            await get().addAssistantMessage(conversationId, streamingMessage.content);
            
            // Clear streaming message state
            set({ streamingMessage: null });
          } catch (error) {
            console.error('[MessageStore] Error saving completed message:', error);
            // Still clear streaming state even if save fails
            set({ streamingMessage: null });
          }
        }
      };
      
      // Set up error handler
      const errorHandler = (error: Error) => {
        console.error('[MessageStore] WebSocket error:', error);
        set({
          error: error,
          streamingMessage: null // Reset streaming state on error
        });
      };
      
      // Register handlers
      const contentUnsubscribe = webSocketService.onMessage(contentHandler);
      const completeUnsubscribe = webSocketService.onComplete(completeHandler);
      const errorUnsubscribe = webSocketService.onError(errorHandler);
      
      unsubscribeFunctions.push(contentUnsubscribe, completeUnsubscribe, errorUnsubscribe);
      
      // Connect to WebSocket
      await webSocketService.connect(configName, conversationId, messages);
      console.log(`[MessageStore] Successfully connected to conversation: ${conversationId}`);
      
      // Return cleanup function
      return () => {
        console.log(`[MessageStore] Cleaning up connection for conversation: ${conversationId}`);
        unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
        webSocketService.disconnect();
      };
    } catch (error) {
      console.error(`[MessageStore] Error connecting to conversation: ${conversationId}`, error);
      
      // Clean up any subscriptions if connection failed
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
      
      // Set error state
      set({
        error: error instanceof Error ? error : new Error(String(error))
      });
      
      // Rethrow the error
      throw error;
    }
  },
  
  // Send a message
  sendMessage: async (conversationId, content, options = {}) => {
    try {
      const webSocketService = getWebSocketService();
      
      // Check if connected
      if (!webSocketService.isConnected()) {
        throw new Error('Cannot send message: WebSocket not connected');
      }
      
      // If this is a regular message
      if (content) {
        // Add message to store
        await get().addUserMessage(conversationId, content);
      }
      
      // Prepare payload
      let payload: any;
      
      // Handle different message types
      if (options.analysisBundle) {
        // This is an analysis bundle
        payload = {
          type: 'analysis_bundle',
          bundle: options.analysisBundle,
          conversation_id: conversationId
        };
      } else {
        // Regular message
        payload = {
          message: content,
          generate_graph: options.detailedAnalysis
        };
      }
      
      // Send via WebSocket
      webSocketService.sendMessage(payload);
      
      console.log(`[MessageStore] Message sent for conversation: ${conversationId}`);
    } catch (error) {
      console.error('[MessageStore] Error sending message:', error);
      set({
        error: error instanceof Error ? error : new Error(String(error))
      });
      throw error;
    }
  }
}));