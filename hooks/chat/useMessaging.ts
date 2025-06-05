// hooks/useMessaging.ts
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useMessageStore } from '@/stores/chat/MessageStore';
import { useConversationStore } from '@/stores/chat/ConversationStore';

export function useMessaging(conversationId: string) {
  const messageStore = useMessageStore();
  const conversationStore = useConversationStore();
  
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  
  // Handle connection lifecycle
  useEffect(() => {
    if (!conversationId) return;
    
    setIsConnecting(true);
    setConnectionError(null);
    
    let isMounted = true;
    
    async function setupConnection() {
      try {
        const configName = await conversationStore.getConversationConfig(conversationId);
        await messageStore.loadMessages(conversationId);
        const messages = messageStore.getMessages(conversationId);
        
        const cleanup = await messageStore.connectToConversation(
          conversationId,
          configName,
          messages
        );
        
        if (isMounted) {
          cleanupRef.current = cleanup;
          setIsConnected(true);
          setIsConnecting(false);
        } else {
          cleanup();
        }
      } catch (error) {
        if (isMounted) {
          setConnectionError(error instanceof Error ? error : new Error(String(error)));
          setIsConnecting(false);
          setIsConnected(false);
        }
      }
    }
    
    setupConnection();
    
    return () => {
      isMounted = false;
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
        setIsConnected(false);
      }
    };
  }, [conversationId]);

  // Get messages with stable selectors
  const messages = useMessageStore(
    useCallback(
      (state) => state.messages.get(conversationId) || state.getEmptyMessages(),
      [conversationId]
    )
  );
  
  const streamingMessage = useMessageStore(
    useCallback(
      (state) => 
        state.streamingMessage?.conversationId === conversationId
          ? state.streamingMessage
          : null,
      [conversationId]
    )
  );
  
  const isLoading = useMessageStore(state => state.isLoading);
  const messageError = useMessageStore(state => state.error);
  
  const sendMessage = useCallback(async (
    content: string,
    options?: { analysisBundle?: any }
  ) => {
    if (!conversationId || !isConnected) {
      throw new Error('Cannot send message: not connected');
    }
    
    try {
      await messageStore.sendMessage(conversationId, content, options);
      return true;
    } catch (error) {
      console.error('[useMessaging] Error sending message:', error);
      return false;
    }
  }, [conversationId, isConnected, messageStore]);
  
  const reconnect = useCallback(async () => {
    if (isConnected || isConnecting) return;
    
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      const configName = await conversationStore.getConversationConfig(conversationId);
      const messages = messageStore.getMessages(conversationId);
      
      const cleanup = await messageStore.connectToConversation(
        conversationId,
        configName,
        messages
      );
      
      cleanupRef.current = cleanup;
      setIsConnected(true);
      setIsConnecting(false);
      
      return true;
    } catch (error) {
      setConnectionError(error instanceof Error ? error : new Error(String(error)));
      setIsConnecting(false);
      return false;
    }
  }, [conversationId, isConnected, isConnecting, conversationStore, messageStore]);
  
  return useMemo(() => ({
    messages,
    streamingMessage,
    sendMessage,
    isConnected,
    isConnecting,
    reconnect,
    isLoading,
    error: messageError || connectionError
  }), [
    messages,
    streamingMessage,
    sendMessage,
    isConnected,
    isConnecting,
    reconnect,
    isLoading,
    messageError,
    connectionError
  ]);
}