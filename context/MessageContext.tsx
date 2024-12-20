import React, { 
  createContext, 
  useContext, 
  useState, 
  useRef, 
  useCallback, 
  useEffect, 
  useMemo 
} from 'react';
import { WebSocketService } from '@/services/websocket/WebSocketService';
import { StreamHandler } from '@/services/websocket/StreamHandler';
import { 
  Message, 
  ConnectionState, 
  MessageHandler,
  ChatConfigName
} from '@/types/index';
import { MessageContextType } from '@/types/context';

const createInitialConnectionState = (): ConnectionState => ({
  type: 'DISCONNECTED',
  canSendMessage: false,
  canConnect: true,
  isLoading: false
});

const MessageContext = createContext<MessageContextType | null>(null);

export const MessageProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(createInitialConnectionState());
  const [currentConfigName, setCurrentConfigName] = useState<ChatConfigName | null>(null);
  
  const messageHandlerRef = useRef<MessageHandler | null>(null);
  const streamHandler = useMemo(() => new StreamHandler(), []);
  const webSocket = useMemo(() => new WebSocketService(), []);

  const streamingStateRef = useRef({
    content: '',
    messageId: '',
  });

  const connect = useCallback(async (
    configName: ChatConfigName,
    conversationId?: string
  ) => {
    if (webSocket.isConnected() && currentConfigName === configName) {
      console.log('Already connected with this config');
      return;
    }

    try {
      setConnectionState(prev => ({
        ...prev,
        type: 'CONNECTING',
        isLoading: true
      }));
      
      await webSocket.initialize();
      await webSocket.connect(configName, conversationId);
      setCurrentConfigName(configName);
    } catch (error) {
      setConnectionState(prev => ({
        ...prev,
        type: 'ERROR',
        error: error as Error,
        canSendMessage: false,
        isLoading: false
      }));
    }
  }, [webSocket, currentConfigName]);

  const handleStreamContent = useCallback((chunk: string) => {
    streamingStateRef.current.content += chunk;
    
    const streamingMsg: Message = {
      id: streamingStateRef.current.messageId || 'streaming',
      role: 'assistant',
      content: streamingStateRef.current.content
    };
    
    setStreamingMessage(streamingMsg);
  }, []);

  const handleStreamComplete = useCallback(() => {
    const finalMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: streamingStateRef.current.content
    };

    setMessages(prev => [...prev, finalMessage]);
    setStreamingMessage(null);
    
    streamingStateRef.current = {
      content: '',
      messageId: '',
    };

    setConnectionState(prev => ({
      ...prev,
      type: 'CONNECTED',
      isLoading: false,
      canSendMessage: true
    }));
  }, []);

  const handleSignal = useCallback((signal: { type: string; data: any }) => {
    if (messageHandlerRef.current) {
      messageHandlerRef.current(signal.type, signal.data);
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!connectionState.canSendMessage) return;

    const messageId = Date.now().toString();
    const newMessage: Message = {
      id: messageId,
      role: 'user',
      content
    };

    setMessages(prev => [...prev, newMessage]);
    setConnectionState(prev => ({
      ...prev,
      type: 'STREAMING',
      isLoading: true,
      canSendMessage: false
    }));

    streamingStateRef.current.messageId = messageId;

    try {
      console.log('Sending single message to WebSocket:', {
        message: content,
        messageId
      });

      await webSocket.sendMessage({ 
        message: content
      });
    } catch (error) {
      setConnectionState(prev => ({
        ...prev,
        type: 'ERROR',
        error: error as Error,
        canSendMessage: true,
        isLoading: false
      }));
    }
  }, [webSocket, connectionState.canSendMessage]);

  const registerMessageHandler = useCallback((handler: MessageHandler | null) => {
    messageHandlerRef.current = handler;
  }, []);

  useEffect(() => {
    streamHandler.on('content', handleStreamContent);
    streamHandler.on('done', handleStreamComplete);
    streamHandler.on('signal', handleSignal);

    webSocket.on('message', msg => streamHandler.handleMessage(msg));

    webSocket.on('connect', () => {
      setConnectionState(prev => ({
        ...prev,
        type: 'CONNECTED',
        canSendMessage: true,
        isLoading: false
      }));
    });

    webSocket.on('disconnect', () => {
      setCurrentConfigName(null);
      setConnectionState(prev => ({
        ...prev,
        type: 'DISCONNECTED',
        canSendMessage: false,
        isLoading: false
      }));
    });

    webSocket.on('error', (error) => {
      setConnectionState(prev => ({
        ...prev,
        type: 'ERROR',
        error,
        canSendMessage: false,
        isLoading: false
      }));
    });

    return () => {
      webSocket.disconnect();
      streamHandler.off('content', handleStreamContent);
      streamHandler.off('done', handleStreamComplete);
      streamHandler.off('signal', handleSignal);
    };
  }, [webSocket, streamHandler, handleStreamContent, handleStreamComplete, handleSignal]);

  const value = useMemo(() => ({
    messages,
    streamingMessage,
    connectionState,
    registerMessageHandler,
    sendMessage,
    connect
  }), [messages, streamingMessage, connectionState, registerMessageHandler, sendMessage, connect]);

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