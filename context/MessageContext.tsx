import React, { createContext, useState, useContext, useCallback, useEffect, ReactNode, useRef } from 'react';
import { Message } from '@/types';

interface MessageContextType {
  messages: Message[];
  isStreaming: boolean;
  streamingMessage: Message | null;
  sendMessage: (content: string) => void;
  clearMessages: () => void;
  isLoading: boolean;
  connectWebSocket: (configName: string) => void;
}

const MessageContext = createContext<MessageContextType | null>(null);

export const MessageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const latestStreamingContentRef = useRef<string>('');
  

  const connectWebSocket = useCallback((configName: string) => {
    if (socket) {
      socket.close();
    }

    const ws = new WebSocket(`ws://192.168.1.108:8000/api/llm/ws/llm_service/${configName}`);

    ws.onopen = () => {
      console.log("WebSocket connection established");
      setSocket(ws);
      setIsLoading(false);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch(data.type) {
        case 'content':
          setIsStreaming(true);
          setStreamingMessage(prev => {
            const newContent = prev ? prev.content + data.data : data.data;
            latestStreamingContentRef.current = newContent;
            return {
              id: 'streaming',
              role: 'assistant',
              content: newContent
            };
          });
          break;
        case 'done':
          const finalContent = latestStreamingContentRef.current;
          setMessages(prev => {
            const newMessage: Message = {
              id: Date.now().toString(),
              role: 'assistant',
              content: finalContent
            };
            console.log('Adding completed message:', newMessage);
            return [...prev, newMessage];
          });
          setIsStreaming(false);
          setStreamingMessage(null);
          latestStreamingContentRef.current = '';
          console.log('Cleared streaming message');
          break;
        case 'error':
          console.error('Error from server:', data.data);
          setIsStreaming(false);
          setStreamingMessage(null);
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'system',
            content: `Error: ${data.data}`
          }]);
          break;
      }
    };

    ws.onclose = (event) => {
      console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
      setSocket(null);
      setIsLoading(false);
      // Implement reconnection logic if needed
      if (event.code !== 1000) {
        console.log("Attempting to reconnect...");
        setTimeout(() => connectWebSocket(configName), 5000);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error observed:", error);
      setIsLoading(false);
    };

    setIsLoading(true);
  }, []);

  useEffect(() => {
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [socket]);

  const sendMessage = useCallback((content: string) => {
    if (content.trim() && socket && socket.readyState === WebSocket.OPEN) {
      const newMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: content.trim(),
      };
      setMessages(prev => [...prev, newMessage]);
      socket.send(JSON.stringify({ content: content.trim() }));
      setIsLoading(true);
    } else if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error("WebSocket is not open");
    }
  }, [socket]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStreamingMessage(null);
    setIsStreaming(false);
  }, []);

  return (
    <MessageContext.Provider value={{ 
      messages, 
      isStreaming, 
      streamingMessage, 
      sendMessage, 
      clearMessages, 
      isLoading,
      connectWebSocket 
    }}>
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