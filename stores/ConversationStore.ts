// stores/ConversationStore.ts
import { create } from 'zustand';
import { conversationService } from '../services/db/conversation';
import { webSocketService } from '../services/websocket/WebSocketService';
import { Message, Conversation, ChatConfigName } from '@/types';
import { authService } from '@/services/db/auth';

// Define WebSocket message types
type WebSocketSendMessage = 
  | { type: 'message', data: string }
  | { type: 'initialize', data: Message[] }
  | { type: 'analysis_bundle', bundle: any, conversation_id: string }
  | { message: string, generate_graph?: boolean };

interface ConversationStoreState {
  conversations: Map<string, Conversation>;
  activeConversationId: string | null;
  messages: Map<string, Message[]>;
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'error';
  isLoading: boolean;
  error: Error | null;
  
  // Initialize the store
  initializeStore: () => Promise<void>;
  
  // Create a new conversation
  createConversation: (params: {
    title: string;
    firstMessage: string;
    configName: ChatConfigName;
  }) => Promise<string>;
  
  // Create a conversation specifically for workout analysis
  createAnalysisConversation: (
    analysisResults: any,
    options?: {
      title?: string;
      initialMessage?: string;
      configName?: ChatConfigName;
    }
  ) => Promise<string>;
  
  // Get a conversation and its messages
  getConversation: (conversationId: string) => Promise<Conversation>;
  
  // Get all conversations
  getConversations: () => Promise<void>;
  
  // Delete a conversation
  deleteConversation: (conversationId: string) => Promise<void>;
  
  // Send a message to a conversation
  sendMessage: (conversationId: string, content: string, options?: { detailedAnalysis?: boolean }) => Promise<void>;
  
  // Connect to a conversation via WebSocket
  connectToConversation: (conversationId: string, configName: ChatConfigName) => Promise<void>;
  
  // Disconnect from the current conversation
  disconnectFromConversation: () => void;
}

export const useConversationStore = create<ConversationStoreState>((set, get) => ({
  conversations: new Map(),
  activeConversationId: null,
  messages: new Map(),
  connectionState: 'disconnected',
  isLoading: false,
  error: null,
  
  initializeStore: async () => {
    try {
      set({ isLoading: true });
      await get().getConversations();
      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error))
      });
    }
  },
  
  createConversation: async (params) => {
    try {
      set({ isLoading: true });
      
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
        
        return {
          conversations: newConversations,
          activeConversationId: conversation.id,
          isLoading: false
        };
      });
      
      // Connect to conversation websocket
      await get().connectToConversation(conversation.id, params.configName);
      
      return conversation.id;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error))
      });
      throw error;
    }
  },
  
  createAnalysisConversation: async (analysisResults, options = {}) => {
    try {
      set({ isLoading: true });
      
      // Default title and message if not provided
      const title = options.title || 'Workout Analysis';
      const initialMessage = options.initialMessage || 'Analyze my workout data';
      const configName = options.configName || 'workout-analysis' as ChatConfigName;
      
      // Create conversation
      const conversationId = await get().createConversation({
        title,
        firstMessage: initialMessage,
        configName
      });
      
      // Connect to the WebSocket for this conversation
      await get().connectToConversation(conversationId, configName);
      
      // Send analysis bundle through WebSocket
      console.log('[ConversationStore] Sending analysis bundle:', analysisResults);
      webSocketService.sendMessage({
        type: 'analysis_bundle',
        bundle: analysisResults,
        conversation_id: conversationId
      });
      
      set({ isLoading: false });
      return conversationId;
    } catch (error) {
      console.error('[ConversationStore] Error creating analysis conversation:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error))
      });
      throw error;
    }
  },
  
  getConversation: async (conversationId) => {
    try {
      set({ isLoading: true });
      
      // Load conversation from service
      const conversation = await conversationService.getConversation(conversationId);
      
      // Load messages for this conversation
      const messages = await conversationService.getConversationMessages(conversationId);
      
      // Update state
      set((state) => {
        const newConversations = new Map(state.conversations);
        newConversations.set(conversation.id, conversation);
        
        const newMessages = new Map(state.messages);
        newMessages.set(conversation.id, messages);
        
        return {
          conversations: newConversations,
          messages: newMessages,
          activeConversationId: conversationId,
          isLoading: false
        };
      });
      
      return conversation;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error))
      });
      throw error;
    }
  },
  
  getConversations: async () => {
    try {
      set({ isLoading: true });
      
      // Get all user conversations
      const conversations = await conversationService.getUserConversations();
      
      // Update state
      set((state) => {
        const newConversations = new Map();
        conversations.forEach((conversation) => {
          newConversations.set(conversation.id, conversation);
        });
        
        return {
          conversations: newConversations,
          isLoading: false
        };
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error))
      });
      throw error;
    }
  },
  
  deleteConversation: async (conversationId) => {
    try {
      set({ isLoading: true });
      
      // Disconnect if this is the active conversation
      if (get().activeConversationId === conversationId) {
        get().disconnectFromConversation();
      }
      
      // Delete conversation
      await conversationService.deleteConversation(conversationId);
      
      // Update state
      set((state) => {
        const newConversations = new Map(state.conversations);
        newConversations.delete(conversationId);
        
        const newMessages = new Map(state.messages);
        newMessages.delete(conversationId);
        
        return {
          conversations: newConversations,
          messages: newMessages,
          activeConversationId: state.activeConversationId === conversationId ? null : state.activeConversationId,
          isLoading: false
        };
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error))
      });
      throw error;
    }
  },
  
  sendMessage: async (conversationId, content, options = {}) => {
    try {
      // Save message to database
      const message = await conversationService.saveMessage({
        conversationId,
        content,
        sender: 'user'
      });
      
      // Update messages in state
      set((state) => {
        const conversationMessages = state.messages.get(conversationId) || [];
        const newMessages = new Map(state.messages);
        newMessages.set(conversationId, [...conversationMessages, message]);
        
        return { messages: newMessages };
      });
      
      // Send message through WebSocket
      webSocketService.sendMessage({
        message: content,
        generate_graph: options.detailedAnalysis
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error : new Error(String(error))
      });
      throw error;
    }
  },
  
  connectToConversation: async (conversationId, configName) => {
    try {
      set({ connectionState: 'connecting' });
      
      // Disconnect from any current connection
      if (get().connectionState === 'connected') {
        get().disconnectFromConversation();
      }
      
      // Load messages for this conversation if not already loaded
      if (!get().messages.has(conversationId)) {
        const messages = await conversationService.getConversationMessages(conversationId);
        
        set((state) => {
          const newMessages = new Map(state.messages);
          newMessages.set(conversationId, messages);
          return { messages: newMessages };
        });
      }
      
      // Connect to WebSocket
      await webSocketService.connect(configName, conversationId, get().messages.get(conversationId) || []);
      
      // Update state
      set({
        activeConversationId: conversationId,
        connectionState: 'connected'
      });
    } catch (error) {
      console.error('[ConversationStore] Error connecting to conversation:', error);
      set({
        connectionState: 'error',
        error: error instanceof Error ? error : new Error(String(error))
      });
      throw error;
    }
  },
  
  disconnectFromConversation: () => {
    webSocketService.disconnect();
    set({ connectionState: 'disconnected' });
  }
}));