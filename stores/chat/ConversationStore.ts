// stores/ConversationStore.ts
import { create } from 'zustand';
import { conversationService } from '../../services/db/conversation';
import { Conversation, ChatConfigName } from '@/types';
import { authService } from '@/services/db/auth';

interface ConversationStoreState {
  // State
  conversations: Map<string, Conversation>;
  activeConversationId: string | null;
  conversationConfigs: Map<string, ChatConfigName>; // Store conversation configs
  isLoading: boolean;
  error: Error | null;
  
  // Core CRUD operations
  createConversation: (params: {
    title: string;
    firstMessage: string;
    configName: ChatConfigName;
  }) => Promise<string>;
  
  getConversation: (id: string) => Promise<Conversation>;
  getConversations: () => Promise<Conversation[]>;
  deleteConversation: (id: string) => Promise<void>;
  setActiveConversation: (id: string | null) => void;
  
  // Config resolution
  getConversationConfig: (id: string) => Promise<ChatConfigName>;
  
  // Utility methods
  clearError: () => void;
}

export const useConversationStore = create<ConversationStoreState>((set, get) => ({
  // Initial state
  conversations: new Map(),
  activeConversationId: null,
  conversationConfigs: new Map(),
  isLoading: false,
  error: null,
  
  // Create a new conversation
  createConversation: async (params) => {
    try {
      set({ isLoading: true, error: null });
      
      // Get user ID from session
      const session = await authService.getSession();
      if (!session?.user?.id) {
        throw new Error('No authenticated user found');
      }
      
      // Create conversation
      const conversation = await conversationService.createConversation({
        userId: session.user.id,
        title: params.title,
        firstMessage: params.firstMessage,
        configName: params.configName
      });
      
      // Update state
      set((state) => {
        const newConversations = new Map(state.conversations);
        newConversations.set(conversation.id, conversation);
        
        // Also store the config
        const newConfigs = new Map(state.conversationConfigs);
        newConfigs.set(conversation.id, params.configName);
        
        return {
          conversations: newConversations,
          conversationConfigs: newConfigs,
          activeConversationId: conversation.id,
          isLoading: false
        };
      });
      
      return conversation.id;
    } catch (error) {
      console.error('[ConversationStore] Error creating conversation:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error))
      });
      throw error;
    }
  },
  
  // Get a specific conversation
  getConversation: async (id) => {
    try {
      set({ isLoading: true, error: null });
      
      // Load conversation from service
      const conversation = await conversationService.getConversation(id);
      
      // Update state
      set((state) => {
        const newConversations = new Map(state.conversations);
        newConversations.set(conversation.id, conversation);
        
        // Also store the config
        if (conversation.config_name) {
          const newConfigs = new Map(state.conversationConfigs);
          newConfigs.set(conversation.id, conversation.config_name as ChatConfigName);
          
          return {
            conversations: newConversations,
            conversationConfigs: newConfigs,
            isLoading: false
          };
        }
        
        return {
          conversations: newConversations,
          isLoading: false
        };
      });
      
      return conversation;
    } catch (error) {
      console.error('[ConversationStore] Error getting conversation:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error))
      });
      throw error;
    }
  },
  
  // Get all conversations
  getConversations: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Get all user conversations
      const conversations = await conversationService.getUserConversations();
      
      // Update state
      set(() => {
        const newConversations = new Map();
        const newConfigs = new Map();
        
        conversations.forEach((conversation) => {
          newConversations.set(conversation.id, conversation);
          
          // Store configs
          if (conversation.config_name) {
            newConfigs.set(conversation.id, conversation.config_name as ChatConfigName);
          }
        });
        
        return {
          conversations: newConversations,
          conversationConfigs: newConfigs,
          isLoading: false
        };
      });
      
      return conversations;
    } catch (error) {
      console.error('[ConversationStore] Error getting conversations:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error))
      });
      throw error;
    }
  },
  
  // Get conversation config
  getConversationConfig: async (id) => {
    // Check if we already have the config
    const existingConfig = get().conversationConfigs.get(id);
    if (existingConfig) {
      return existingConfig;
    }
    
    try {
      // If not cached, fetch the conversation to get its config
      const conversation = await get().getConversation(id);
      
      // Extract and store config
      const configName = conversation.config_name as ChatConfigName || 'default';
      
      set((state) => {
        const newConfigs = new Map(state.conversationConfigs);
        newConfigs.set(id, configName);
        return { conversationConfigs: newConfigs };
      });
      
      return configName;
    } catch (error) {
      console.error('[ConversationStore] Error resolving conversation config:', error);
      return 'default'; // Fallback to default config
    }
  },
  
  // Delete a conversation
  deleteConversation: async (id) => {
    try {
      set({ isLoading: true, error: null });
      
      // Delete conversation
      await conversationService.deleteConversation(id);
      
      // Update state
      set((state) => {
        const newConversations = new Map(state.conversations);
        newConversations.delete(id);
        
        // Also remove config
        const newConfigs = new Map(state.conversationConfigs);
        newConfigs.delete(id);
        
        // Update active conversation if needed
        const newActiveId = state.activeConversationId === id
          ? null
          : state.activeConversationId;
        
        return {
          conversations: newConversations,
          conversationConfigs: newConfigs,
          activeConversationId: newActiveId,
          isLoading: false
        };
      });
    } catch (error) {
      console.error('[ConversationStore] Error deleting conversation:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error))
      });
      throw error;
    }
  },
  
  // Set active conversation
  setActiveConversation: (id) => {
    set({ activeConversationId: id });
  },
  
  // Clear error
  clearError: () => {
    set({ error: null });
  }
}));