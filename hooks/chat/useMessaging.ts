// hooks/chat/useMessaging.ts
import { useCallback } from "react";
import { useMessageStore } from "@/stores/chat/MessageStore";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { Message } from "@/types";

const EMPTY_MESSAGES: Message[] = [];

export function useMessaging() {
  const messageStore = useMessageStore();

  // Get conversationId from session store
  const conversationId = useUserSessionStore(
    (state) => state.activeConversationId
  );

  // Clean selectors without logging
  const messages = useMessageStore((state) => {
    if (!conversationId || !state.messages) {
      return EMPTY_MESSAGES;
    }

    const conversationMessages = state.messages.get(conversationId);
    if (!conversationMessages) {
      return EMPTY_MESSAGES;
    }

    return conversationMessages;
  });

  const streamingMessage = useMessageStore((state) => {
    if (!conversationId || !state.streamingMessages) {
      return null;
    }
    return state.streamingMessages.get(conversationId) || null;
  });

  const isStreaming = useMessageStore((state) => {
    if (!conversationId || !state.streamingMessages) return false;
    const streaming = state.streamingMessages.get(conversationId);
    return streaming != null && !streaming.isComplete;
  });

  const isLoading = useMessageStore((state) => state.isLoading);
  const error = useMessageStore((state) => state.error);

  const sendMessage = useCallback(
    async (content: string, options?: { detailedAnalysis?: boolean }) => {
      const currentConversationId =
        useUserSessionStore.getState().activeConversationId;
      if (!currentConversationId) {
        throw new Error("No active conversation");
      }

      await messageStore.sendMessage(currentConversationId, content, options);
    },
    []
  );

  const loadMessages = useCallback(async () => {
    const currentConversationId =
      useUserSessionStore.getState().activeConversationId;
    if (!currentConversationId) {
      return [];
    }

    return messageStore.loadMessages(currentConversationId);
  }, []);

  return {
    messages,
    streamingMessage,
    isStreaming,
    isLoading,
    error,
    sendMessage,
    loadMessages,
    hasMessages: messages.length > 0,
    messageCount: messages.length,
    conversationId,
  };
}
