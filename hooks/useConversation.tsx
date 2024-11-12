/*import { useState, useCallback, useRef, useEffect } from 'react';
import { Message } from '@/types';

export function useConversation() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamingMessageRef = useRef<Message | null>(null);

  useEffect(() => {
    console.log('Messages updated:', messages);
  }, [messages]);

  const sendMessage = useCallback(async (content: string, configName: string) => {
    console.log('Sending message:', content);
    setIsLoading(true);
    setIsStreaming(true);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
    };
    setMessages(prev => {
      console.log('Adding user message:', [...prev, userMessage]);
      return [...prev, userMessage];
    });

    try {
      const payload = { messages: [...messages, userMessage] };
      console.log('Request payload:', payload);

      const response = await fetch(`http://192.168.1.110:8000/api/llm/process_stream/${configName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send message: ${response.status} ${errorText}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      streamingMessageRef.current = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: '',
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        console.log('Received chunk:', chunk);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            console.log('Parsed data:', data);
            if (data.type === 'content' && streamingMessageRef.current) {
              streamingMessageRef.current.content += data.content;
              setMessages(prev => [
                ...prev.slice(0, -1),
                { ...streamingMessageRef.current! },
              ]);
            } else if (data.type === 'stop') {
              if (streamingMessageRef.current) {
                setMessages(prev => [...prev, streamingMessageRef.current!]);
              }
              streamingMessageRef.current = null;
              setIsStreaming(false);
              break;
            }
          }
        }
      }
    } catch (error: unknown) {
      console.error('Error in sendMessage:', error);
      
      let errorMessage = 'An unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setMessages(prev => [...prev, {
        id: `error_${Date.now()}`,
        role: 'system',
        content: `Error: ${errorMessage}`
      }]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [messages]); 

  return { messages, isLoading, isStreaming, sendMessage };
}*/