import { useState, useCallback } from 'react';
import { Conversation, Message } from '@/types';
import Constants from 'expo-constants';

interface UseConversationProps {
  initialConversation: Conversation;
}

interface ApiResponse {
  id: string;
  type: string;
  role: 'assistant';
  content: Array<{ type: string; text: string }>;
  model: string;
  stop_reason: string;
  stop_sequence: null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export function useConversation({ initialConversation }: UseConversationProps) {
  const [conversation, setConversation] = useState<Conversation>(initialConversation);

  const sendMessage = useCallback(async (message: string, configName: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
    };

    const updatedMessages = [...conversation.messages, newMessage];

    // Update conversation immediately with user message
    setConversation(prev => ({
      ...prev,
      messages: updatedMessages,
      lastMessage: message,
      lastMessageTime: new Date().toISOString(),
    }));

    // Send request to the LLM service
    const apiUrl = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8000';
    const url = `${apiUrl}/api/llm/process/${configName}`;
    console.log('Sending request to:', url);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: updatedMessages }),
      });
  
      if (response.ok) {
        const result = await response.json();
        
        if (result && result.response && Array.isArray(result.response)) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: result.response.map((item: { text: any; }) => item.text).join(' ')
          };
  
          setConversation(prev => ({
            ...prev,
            messages: [...prev.messages, assistantMessage],
            lastMessage: assistantMessage.content,
            lastMessageTime: new Date().toISOString(),
          }));
        } else {
          console.error('Unexpected response structure:', result);
          // Handle error (e.g., add an error message to the conversation)
        }
      } else {
        console.error('Error from LLM service:', response.statusText);
        // Handle error (e.g., add an error message to the conversation)
      }
    } catch (error) {
      console.error('Error sending message to LLM service:', error);
      // Handle error (e.g., add an error message to the conversation)
    }
  }, [conversation]);
  return {
    conversation,
    sendMessage,
  };
}