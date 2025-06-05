// hooks/useMessaging.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { useMessageStore } from '@/stores/chat/MessageStore';
import { useConversationStore } from '@/stores/chat/ConversationStore';
import { Message } from '@/types';

/**
 * Hook for managing conversation messaging
 * Handles WebSocket connection, message loading, streaming, and sending
 */
export function useMessaging(conversationId: string) {
  const messageStore = useMessageStore();
  const conversationStore = useConversationStore();
  
  // Track connection state and cleanup function
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  
  // Handle connection lifecycle
  useEffect(() => {
    if (!conversationId) return;
    
    // Set initial states
    setIsConnecting(true);
    setConnectionError(null);
    
    let isMounted = true; // Track if component is mounted
    
    async function setupConnection() {
      try {
        console.log(`[useMessaging] Setting up connection for conversation: ${conversationId}`);
        
        // Get configuration
        const configName = await conversationStore.getConversationConfig(conversationId);
        console.log(`[useMessaging] Using config: ${configName}`);
        
        // Load messages if needed
        await messageStore.loadMessages(conversationId);
        
        // Get messages for WebSocket initialization
        const messages = messageStore.getMessages(conversationId);
        console.log(`[useMessaging] Loaded ${messages.length} messages`);
        
        // Connect through the store
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
          // Component unmounted while connecting, clean up immediately
          cleanup();
        }
      } catch (error) {
        console.error('[useMessaging] Error connecting:', error);
        
        if (isMounted) {
          setConnectionError(error instanceof Error ? error : new Error(String(error)));
          setIsConnecting(false);
          setIsConnected(false);
        }
      }
    }
    
    setupConnection();
    
    // Cleanup function
    return () => {
      isMounted = false;
      
      if (cleanupRef.current) {
        console.log(`[useMessaging] Cleaning up connection for conversation: ${conversationId}`);
        cleanupRef.current();
        cleanupRef.current = null;
        setIsConnected(false);
      }
    };
  }, [conversationId, conversationStore, messageStore]);
  
  // Get messages from store with proper typing
  const messages = useMessageStore(state => state.getMessages(conversationId));
  
  // Get streaming message if it's for this conversation
  const streamingMessage = useMessageStore(state => 
    state.streamingMessage?.conversationId === conversationId
      ? state.streamingMessage
      : null
  );
  
  // Get loading state for messages
  const isLoading = useMessageStore(state => state.isLoading);
  
  // Get error state
  const messageError = useMessageStore(state => state.error);
  
  // Send a message with options
  const sendMessage = useCallback(async (
    content: string,
    analysisBundle?: any
  ) => {
    if (!conversationId || !isConnected) {
      throw new Error('Cannot send message: not connected');
    }
    
    try {
      await messageStore.sendMessage(conversationId, content);
      return true;
    } catch (error) {
      console.error('[useMessaging] Error sending message:', error);
      return false;
    }
  }, [conversationId, isConnected, messageStore]);
  
  // Reconnect if connection was lost
  const reconnect = useCallback(async () => {
    if (isConnected || isConnecting) return;
    
    // Clean up any existing connection
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    
    // Reset states
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      // Get configuration
      const configName = await conversationStore.getConversationConfig(conversationId);
      
      // Get messages for initialization
      const messages = messageStore.getMessages(conversationId);
      
      // Connect again
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
      console.error('[useMessaging] Error reconnecting:', error);
      setConnectionError(error instanceof Error ? error : new Error(String(error)));
      setIsConnecting(false);
      return false;
    }
  }, [conversationId, isConnected, isConnecting, conversationStore, messageStore]);
  
  // Return everything needed for messaging
  return {
    // Messages data
    messages,
    streamingMessage,
    
    // Message actions
    sendMessage,
    
    // Connection status and actions
    isConnected,
    isConnecting,
    reconnect,
    
    // Loading and error states
    isLoading,
    error: messageError || connectionError
  };
}

export default useMessaging;