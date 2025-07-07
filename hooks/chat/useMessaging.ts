// hooks/useMessaging.ts
import { useCallback, useMemo } from 'react';
import { useMessageStore } from '@/stores/chat/MessageStore';

export function useMessaging(conversationId: string) {
  const messageStore = useMessageStore();
  
  // State selectors
  const messages = useMessageStore(
    useCallback(
      (state) => state.messages.get(conversationId) || state.getEmptyMessages(),
      [conversationId]
    )
  );
  
  const streamingMessage = useMessageStore(
    useCallback(
      (state) => state.getStreamingMessage(conversationId),
      [conversationId]
    )
  );
  
  const isStreaming = useMessageStore(
    useCallback(
      (state) => state.isConversationStreaming(conversationId),
      [conversationId]
    )
  );
  
  const isLoading = useMessageStore(state => state.isLoading);
  const error = useMessageStore(state => state.error);
  
  // Simple pass-through to MessageStore
  const sendMessage = useCallback(async (
    content: string,
    options?: { detailedAnalysis?: boolean, conversationId?: string } // Add conversationId here
  ) => {
    const targetConversationId = options?.conversationId || conversationId; // Use provided ID or hook's ID
    if (!targetConversationId) {
      throw new Error('Cannot send message: no conversationId');
    }
    
    await messageStore.sendMessage(targetConversationId, content, options);
  }, [conversationId, messageStore]);
  
  // Load messages on demand
  const loadMessages = useCallback(async () => {
    if (!conversationId) return [];
    return messageStore.loadMessages(conversationId);
  }, [conversationId, messageStore]);
  
  return useMemo(() => ({
    messages,
    streamingMessage,
    isStreaming,
    isLoading,
    error,
    sendMessage,
    loadMessages,
    hasMessages: messages.length > 0,
    messageCount: messages.length
  }), [
    messages,
    streamingMessage,
    isStreaming,
    isLoading,
    error,
    sendMessage,
    loadMessages
  ]);
}