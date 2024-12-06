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
  WebSocketConfig, 
  ChatConfigName
} from '@/types/index';

interface MessageContextType {
  messages: Message[];
  streamingMessage: Message | null;
  connectionState: ConnectionState;
  registerMessageHandler: (handler: MessageHandler | null) => void;
  sendMessage: (content: string) => void;
  connect: (configName: ChatConfigName) => Promise<void>;
}

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
  const latestStreamingContentRef = useRef<string>('');
  const messageHandlerRef = useRef<MessageHandler | null>(null);
  const streamHandler = useMemo(() => new StreamHandler(), []);
  const webSocket = useMemo(() => new WebSocketService(), []);

  const connect = useCallback(async (configName: ChatConfigName) => {
    try {
      setConnectionState(prev => ({
        ...prev,
        type: 'CONNECTING',
        isLoading: true
      }));
      
      await webSocket.initialize();
      await webSocket.connect(configName);
    } catch (error) {
      setConnectionState(prev => ({
        ...prev,
        type: 'ERROR',
        error: error as Error,
        canSendMessage: false,
        isLoading: false
      }));
    }
  }, [webSocket]);

  const handleStreamContent = useCallback((chunk: string) => {
    setStreamingMessage(prev => {
      const newContent = prev ? prev.content + chunk : chunk;
      latestStreamingContentRef.current = newContent;
      return {
        id: 'streaming',
        role: 'assistant',
        content: newContent
      };
    });
  }, []);

  const handleStreamComplete = useCallback(() => {
    const finalContent = latestStreamingContentRef.current;
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'assistant',
      content: finalContent
    }]);
    setStreamingMessage(null);
    latestStreamingContentRef.current = '';
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

    const newMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content
    };
    setMessages(prev => {
        const updatedMessages = [...prev, newMessage];
        console.log('Updated messages array:', updatedMessages);
        return updatedMessages;
    });

    setConnectionState(prev => ({
        ...prev,
        type: 'STREAMING',
        isLoading: true,
        canSendMessage: false
    }));

    try {
        // Only send the new message
        console.log('Sending single message to WebSocket:', {
            message: content,
            messageId: newMessage.id  //for tracking
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