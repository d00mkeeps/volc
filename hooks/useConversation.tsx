import { useState, useCallback, useRef, useEffect } from 'react';
import Constants from 'expo-constants';
import EventSource, {EventSourceListener} from 'react-native-sse';
import { UseConversationProps, Conversation, Message } from '@/types';

export function useConversation({ initialConversation }: UseConversationProps) {
  const [conversation, setConversation] = useState<Conversation>(initialConversation);
  const [isStreaming, setIsStreaming] = useState(false);
  const currentStreamingMessage = useRef<Message | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const sendMessage = useCallback(async (message: string, configName: string) => {
    if (isStreaming) {
      console.log('A message is already being processed');
      return;
    }

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
    };

    setConversation((prev) => ({
      ...prev,
      messages: [...prev.messages, newUserMessage],
      lastMessage: message,
      lastMessageTime: new Date().toISOString(),
    }));

    const apiUrl = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8000';
    const url = `${apiUrl}/api/llm/process_stream/${configName}`;
    console.log('Sending request to:', url);

    setIsStreaming(true);
    currentStreamingMessage.current = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
    };

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    eventSourceRef.current = new EventSource(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages: [...conversation.messages, newUserMessage] }),
    });

    const messageListener: EventSourceListener = (event) => {
      if (event.type !== 'message') return;

      const data = event.data;
      if (typeof data !== 'string') return;

      try {
        const parsedData = JSON.parse(data);

        switch (parsedData.type) {
          case 'content':
            if (currentStreamingMessage.current) {
              const updatedMessage: Message = {
                ...currentStreamingMessage.current,
                content: currentStreamingMessage.current.content + parsedData.content,
              };
              currentStreamingMessage.current = updatedMessage;
              setConversation((prev) => ({
                ...prev,
                messages: [...prev.messages.filter(m => m.role !== 'assistant'), updatedMessage],
              }));
            }
            break;
          case 'stop':
            setIsStreaming(false);
            if (currentStreamingMessage.current) {
              const finalMessage = currentStreamingMessage.current;
              setConversation((prev) => ({
                ...prev,
                messages: [...prev.messages.filter(m => m.role !== 'assistant'), finalMessage],
                lastMessage: finalMessage.content,
                lastMessageTime: new Date().toISOString(),
              }));
              currentStreamingMessage.current = null;
            }
            if (eventSourceRef.current) {
              eventSourceRef.current.close();
            }
            break;
        }
      } catch (error) {
        if (data === '[DONE]') {
          setIsStreaming(false);
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
          }
        } else if (data.startsWith('[ERROR]')) {
          console.error('Error from server:', data);
          setIsStreaming(false);
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
          }
        } else {
          console.error('Error parsing event data:', error);
        }
      }
    };

    eventSourceRef.current.addEventListener('message', messageListener);

    eventSourceRef.current.addEventListener('error', ((error: any) => {
      console.error('EventSource error:', error);
      setIsStreaming(false);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    }) as EventSourceListener);

  }, [conversation]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return {
    conversation,
    sendMessage,
    isStreaming,
  };
}