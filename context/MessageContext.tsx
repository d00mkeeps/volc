import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Message } from '@/types';
import axios, { AxiosProgressEvent, CancelTokenSource } from 'axios';

interface MessageContextType {
  messages: Message[];
  streamingMessage: Message | null;
  draftMessage: string;
  isLoading: boolean;
  isStreaming: boolean;
  sendMessage: (content: string, configName: string) => Promise<void>;
  setDraftMessage: (draft: string) => void;
}

interface MessageProviderProps {
  children: ReactNode;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider: React.FC<MessageProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null);
  const [draftMessage, setDraftMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = useCallback(async (content: string, configName: string) => {
    console.log('sendMessage function called', { content, configName });
    setIsLoading(true);
    setIsStreaming(true);
  
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
    };
  
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
    };
  
    setMessages(prev => [...prev, userMessage, assistantMessage]);
  
    const baseUrl = "http://192.168.1.110:8000";
    const url = `${baseUrl}/api/llm/process_stream/${configName}`;
  
    let source: CancelTokenSource | null = null;
  
    try {
      source = axios.CancelToken.source();
      let buffer = '';
      let lastProcessedLength = 0;
  
      const config = {
        method: 'post',
        url: url,
        data: { messages: [...messages, userMessage] },
        headers: {
          'Content-Type': 'application/json',
        },
        responseType: 'text' as const,
        cancelToken: source.token,
        onDownloadProgress: (progressEvent: AxiosProgressEvent) => {
          const responseText = progressEvent.event?.target?.response as string;
          if (responseText && responseText.length > lastProcessedLength) {
            const newData = responseText.slice(lastProcessedLength);
            buffer += newData;
            lastProcessedLength = responseText.length;
  
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';
  
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6); // Remove 'data: ' prefix
  
                if (data === '[DONE]') {
                  setIsStreaming(false);
                  source?.cancel('Stream complete');
                  return;
                }
  
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    setMessages(prev => {
                      const updated = [...prev];
                      const currentContent = updated[updated.length - 1].content || '';
                      if (!currentContent.endsWith(parsed.content)) {
                        updated[updated.length - 1] = {
                          ...updated[updated.length - 1],
                          content: currentContent + parsed.content
                        };
                      }
                      return updated;
                    });
                  } else if (parsed.error) {
                    console.error('Error from server:', parsed.error);
                  }
                } catch (e) {
                  console.error('Error parsing JSON:', e, 'Raw data:', data);
                }
              }
            }
          }
        },
      };
  
      await axios(config);
  
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
      } else {
        console.error('Error in sendMessage:', error);
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [messages]);

  const value = {
    messages,
    streamingMessage,
    draftMessage,
    isLoading,
    isStreaming,
    sendMessage,
    setDraftMessage,
  };

  return <MessageContext.Provider value={value}>{children}</MessageContext.Provider>;
};

export const useMessage = () => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
};