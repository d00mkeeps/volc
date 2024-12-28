import { ConversationService } from "@/services/supabase/conversation";
import { StreamHandler } from "@/services/websocket/StreamHandler";
import { WebSocketService } from "@/services/websocket/WebSocketService";
import { Message } from "@/types";
import { createInitialConnectionState, MessageHandler } from "@/types/core";
import { ConnectionState } from "@/types/states";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

interface MessageContextType {
  messages: Message[];
  streamingMessage: Message | null;
  connectionState: ConnectionState;
  startNewConversation: (firstMessage: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
  registerMessageHandler: (handler: MessageHandler | null) => void;
}
const MessageContext = createContext<MessageContextType | null>(null);
export const MessageProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(createInitialConnectionState());
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  const conversationService = useMemo(() => new ConversationService(), []);
  const webSocket = useMemo(() => new WebSocketService(), []);
  const streamHandler = useMemo(() => new StreamHandler(), []);
  const messageHandlerRef = useRef<MessageHandler | null>(null);

  const loadConversation = useCallback(async (conversationId: string) => {
    try {
      console.log('MessageContext: Loading conversation:', conversationId);
      
      const [conversation, messages] = await Promise.all([
        conversationService.getConversation(conversationId),
        conversationService.getConversationMessages(conversationId)
      ]);
  
      console.log('MessageContext: Conversation details:', {
        id: conversation.id,
        config_name: conversation.config_name
      });
  
      setMessages(messages);
      setCurrentConversationId(conversationId);
      
      await webSocket.connect(conversation.config_name, conversationId);
    } catch (error) {
      console.error('MessageContext: Error loading conversation:', error);
      setConnectionState(prev => ({
        ...prev,
        type: 'ERROR',
        error: error as Error
      }));
    }
  }, [conversationService, webSocket]);

  const startNewConversation = useCallback(async (firstMessage: string) => {
    if (!connectionState.canConnect) return;
  
    try {
      const conversation = await conversationService.createConversation({
        userId: 'current-user-id',
        title: firstMessage.substring(0, 50),
        firstMessage,
        configName: 'chat'  //TODO: Add this parameter
      });
  
      setCurrentConversationId(conversation.id);
      setMessages([]);
      await loadConversation(conversation.id);
    } catch (error) {
      setConnectionState(prev => ({
        ...prev,
        type: 'ERROR',
        error: error as Error
      }));
    }
  }, [connectionState.canConnect, conversationService, loadConversation]);

  const sendMessage = useCallback(async (content: string) => {
    if (!currentConversationId || !connectionState.canSendMessage) return;

    try {
      const newMessage = await conversationService.saveMessage({
        conversationId: currentConversationId,
        content,
        sender: 'user'
      });

      setMessages(prev => [...prev, newMessage]);
      await webSocket.sendMessage({ message: content });
    } catch (error) {
      setConnectionState(prev => ({
        ...prev,
        type: 'ERROR',
        error: error as Error
      }));
    }
  }, [currentConversationId, connectionState.canSendMessage, conversationService, webSocket]);

 // WebSocket handler
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

  webSocket.on('message', msg => streamHandler.handleMessage(msg));
  
  return () => {
    webSocket.disconnect();
  };
}, [webSocket, streamHandler]);

// Stream handler
useEffect(() => {
  streamHandler.on('content', (chunk: string) => {
    if (!currentConversationId) return;
    
    setStreamingMessage(prev => ({
      id: 'streaming',
      conversation_id: currentConversationId,
      content: prev ? prev.content + chunk : chunk,
      sender: 'assistant',
      conversation_sequence: (messages[messages.length - 1]?.conversation_sequence || 0) + 1,
      timestamp: new Date()
    }));
  });

  streamHandler.on('done', async () => {
    if (!streamingMessage || !currentConversationId) return;
    
    const finalMessage = await conversationService.saveMessage({
      conversationId: currentConversationId,
      content: streamingMessage.content,
      sender: 'assistant'
    });

    setMessages(prev => [...prev, finalMessage]);
    setStreamingMessage(null);
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
    registerMessageHandler: (handler: MessageHandler | null) => {
      messageHandlerRef.current = handler;
    }
  }), [messages, streamingMessage, connectionState, startNewConversation, sendMessage, loadConversation]);

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