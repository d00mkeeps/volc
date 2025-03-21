import { ChatConfigKey } from "@/constants/ChatConfigMaps";
import { LLMService } from "@/services/llm/base";
import { authService } from "@/services/supabase/auth";
import { ConversationService } from "@/services/supabase/conversation";
import { getWebSocketService, resolveConfig } from "@/services/websocket/GlobalWebsocketService";
import { StreamHandler } from "@/services/websocket/StreamHandler";
import { Message } from "@/types";
import { createInitialConnectionState, MessageHandler } from "@/types/core";
import { ConnectionState } from "@/types/states";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

interface MessageContextType {
  messages: Message[];
  streamingMessage: Message | null;
  connectionState: ConnectionState;
  startNewConversation: (firstMessage: string, configName: ChatConfigKey) => Promise<string>;
  sendMessage: (content: string, options?: { detailedAnalysis?: boolean }) => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
  currentConversationId: string | null;
  registerMessageHandler: (handler: MessageHandler | null) => void;
  showLoader: boolean;
  didMessageRequestGraph: (messageId: string) => boolean;
  // Changed from Promise to synchronous return
  getConversationConfig: (conversationId: string) => ChatConfigKey;
}

const fetchConversationConfig = async (
  conversationId: string,
  conversationService: ConversationService
): Promise<ChatConfigKey> => {
  try {
    const conversation = await conversationService.getConversation(conversationId);
    return conversation.config_name as ChatConfigKey;
  } catch (error) {
    console.error('Error fetching conversation config:', error);
    return 'default';
  }
};

const MessageContext = createContext<MessageContextType | null>(null);

export const MessageProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(createInitialConnectionState());
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const accumulatedMessageRef = useRef<string>('');
  const [showLoader, setShowLoader] = useState(false);
  const conversationService = useMemo(() => new ConversationService(), []);
  const webSocket = useMemo(() => getWebSocketService(), []);
    const streamHandler = useMemo(() => new StreamHandler(), []);
  const messageHandlerRef = useRef<MessageHandler | null>(null);
  const [messagesRequestingGraphs, setMessagesRequestingGraphs] = useState<Set<string>>(new Set());
  const [conversationConfigMap, setConversationConfigMap] = useState<Record<string, ChatConfigKey>>({});

  const getConversationConfig = useCallback((conversationId: string): ChatConfigKey => {
    return conversationConfigMap[conversationId] || 'default';
  }, [conversationConfigMap]);

// In MessageContext.tsx - loadConversation function
const loadConversation = useCallback(async (conversationId: string) => {
  try {
    setMessages([]);
    setStreamingMessage(null);
    
    const config = await resolveConfig(conversationId);
    const messages = await conversationService.getConversationMessages(conversationId);
    
    setMessages(messages);
    setCurrentConversationId(conversationId);
    setConversationConfigMap(prev => ({...prev, [conversationId]: config as ChatConfigKey}));
    
    await webSocket.connect(config, conversationId, messages);
  } catch (error) {
    console.error('Error loading conversation:', error);
    setConnectionState(prev => ({
      ...prev,
      type: 'ERROR',
      error: error as Error
    }));  }
}, [conversationService, webSocket]);


  const startNewConversation = useCallback(async (firstMessage: string, configName: ChatConfigKey): Promise<string> => {
    const session = await authService.getSession();
    if (!session?.user?.id) {
      throw new Error('No authenticated user found');
    }
  
    if (!connectionState.canConnect) {
      throw new Error('Cannot connect to create conversation');
    }
  
    try {
      console.log('🏁 Starting new conversation:', { firstMessage, configName });
      
      const llmService = new LLMService();
      const title = await llmService.generateTitle(firstMessage);
      
      const conversation = await conversationService.createConversation({
        userId: session.user.id,
        title,
        firstMessage,
        configName // Use the passed in config
      });
  
      setCurrentConversationId(conversation.id);
      setMessages([]);
      await loadConversation(conversation.id);
  
      return conversation.id;
      
    } catch (error) {
      console.error('❌ Failed to start conversation:', error);
      setConnectionState(prev => ({
        ...prev,
        type: 'ERROR',
        error: error as Error
      }));
      throw error;
    }
  }, [connectionState.canConnect, conversationService, loadConversation]);

  const sendMessage = useCallback(async (content: string, options?: { detailedAnalysis?: boolean }) => {
    if (!currentConversationId || !connectionState.canSendMessage) {
      return;
    }
  
    try {
      setShowLoader(true);
      const newMessage = await conversationService.saveMessage({
        conversationId: currentConversationId,
        content,
        sender: 'user'
      });
      
      // Track if this message requested a graph
      if (options?.detailedAnalysis) {
        setMessagesRequestingGraphs(prev => {
          const updated = new Set(prev);
          updated.add(newMessage.id);
          return updated;
        });
      }
      
      setMessages(prev => [...prev, newMessage]);
      await webSocket.sendMessage({ 
        message: content,
        generate_graph: options?.detailedAnalysis 
      });
    } catch (error) {
      setShowLoader(false);
      console.error('MessageContext: Error sending message:', error);
      setConnectionState(prev => ({
        ...prev,
        type: 'ERROR',
        error: error as Error
      }));
    }
  }, [currentConversationId, connectionState.canSendMessage, conversationService, webSocket]);

// Add this helper function to check if a message requested a graph
const didMessageRequestGraph = useCallback((messageId: string) => {
  return messagesRequestingGraphs.has(messageId);
}, [messagesRequestingGraphs]);

// Add a function to clear graph request state once a graph arrives
const clearGraphRequest = useCallback((messageId: string) => {
  setMessagesRequestingGraphs(prev => {
    const updated = new Set(prev);
    updated.delete(messageId);
    return updated;
  });
}, []);
useEffect(() => {
  webSocket.on('connect', () => {
    setConnectionState(prev => ({
      ...prev,
      type: 'CONNECTED',
      canSendMessage: true
    }));
  });

  webSocket.on('disconnect', () => {
    setConnectionState(prev => ({
      ...prev,
      type: 'DISCONNECTED',
      canSendMessage: false
    }));
  });

  webSocket.on('error', (error: Error) => {
    setConnectionState(prev => ({
      ...prev,
      type: 'ERROR',
      error: error
    }));
  });

  // Modify the signal handler in the streamHandler useEffect
streamHandler.on('signal', (signal: { type: string; data: any }) => {
  console.log('MessageContext: Received signal:', signal);
  
  // If this is a workout data bundle signal, find the associated message
  if (signal.type === 'workout_data_bundle' && signal.data?.original_query) {
    // Find the message that triggered this graph
    messages.forEach(msg => {
      if (msg.sender === 'user' && messagesRequestingGraphs.has(msg.id) && 
          msg.content.includes(signal.data.original_query)) {
        // Clear the graph request state
        clearGraphRequest(msg.id);
      }
    });
  }
  
  if (messageHandlerRef.current) {
    messageHandlerRef.current(signal.type, signal.data);
  }
});

  webSocket.on('message', msg => streamHandler.handleMessage(msg));
  
  return () => {
    webSocket.disconnect();
  };
}, [webSocket, streamHandler]);

// Stream handler
useEffect(() => {
  streamHandler.on('loadingStart', () => {
    setShowLoader(true)
    console.log('showing loader')

  })

  streamHandler.on('loadingDone', () => {
    setShowLoader(false)
    console.log('hiding loader')

  })

  streamHandler.on('content', (chunk: string) => {
    if (!currentConversationId) return;

    accumulatedMessageRef.current += chunk;
    setStreamingMessage({
      id: 'streaming',
      conversation_id: currentConversationId,
      content: accumulatedMessageRef.current,
      sender: 'assistant',
      conversation_sequence: (messages[messages.length -1]?.conversation_sequence || 0) + 1,
      timestamp: new Date()
    })
    
    setStreamingMessage(prev => ({
      id: 'streaming',
      conversation_id: currentConversationId,
      content: prev ? prev.content + chunk : chunk,
      sender: 'assistant',
      conversation_sequence: (messages[messages.length - 1]?.conversation_sequence || 0) + 1,
      timestamp: new Date(0)
    }));
  });

  streamHandler.on('signal', (signal: { type: string; data: any }) => {
    console.log('MessageContext: Received signal:', signal);
    if (messageHandlerRef.current) {
      console.log('MessageContext: Forwarding signal to handler');
      messageHandlerRef.current(signal.type, signal.data);
    }else {
      console.log('MessageContext: No message handler registered');}
  });

  streamHandler.on('done', async () => {
    console.log('✅ Stream done');  // Remove the firstChunkReceived reset
    if (!currentConversationId) return;
    
    const finalMessage = await conversationService.saveMessage({
      conversationId: currentConversationId,
      content: accumulatedMessageRef.current,
      sender: 'assistant'
    });

    setMessages(prev => [...prev, finalMessage]);
    setStreamingMessage(null);
    accumulatedMessageRef.current = '';
    setConnectionState(prev => ({
      ...prev,
      type: 'CONNECTED',
      canSendMessage: true
    }));
  });

  return () => {
    streamHandler.removeAllListeners();
  };
}, [currentConversationId, messages, streamingMessage, conversationService]);

  const value = useMemo(() => ({
    messages,
    streamingMessage,
    connectionState,
    startNewConversation,
    sendMessage,
    loadConversation,
    currentConversationId,
    showLoader,
    didMessageRequestGraph,
    getConversationConfig,
    registerMessageHandler: (handler: MessageHandler | null) => {
      messageHandlerRef.current = handler;
    }
  }), [messages, streamingMessage, connectionState, startNewConversation, sendMessage, loadConversation, showLoader, getConversationConfig,didMessageRequestGraph ]);

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
};