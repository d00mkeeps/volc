import { useCallback, useEffect, useRef } from "react";
import { useMessageStore } from "@/stores/chat/MessageStore";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { useWorkoutAnalysisStore } from "@/stores/analysis/WorkoutAnalysisStore";
import { useAnalysisBundleStore } from "@/stores/attachments/AnalysisBundleStore";
import { getWebSocketService } from "@/services/websocket/WebSocketService";
import { conversationService } from "@/services/db/conversation";
import { Message } from "@/types";
import Toast from "react-native-toast-message";

const EMPTY_MESSAGES: Message[] = [];

export function useMessaging() {
  const messageStore = useMessageStore();
  const webSocketService = getWebSocketService();
  const unsubscribeRefs = useRef<(() => void)[]>([]);

  // Get conversationId from session
  const conversationId = useUserSessionStore(
    (state) => state.activeConversationId
  );

  // Selectors for state
  const messages = useMessageStore((state) => {
    if (!conversationId || !state.messages) {
      return EMPTY_MESSAGES;
    }
    return state.messages.get(conversationId) || EMPTY_MESSAGES;
  });

  const streamingMessage = useMessageStore((state) => {
    if (!conversationId || !state.streamingMessages) {
      return null;
    }
    return state.streamingMessages.get(conversationId) || null;
  });

  const isStreaming = !!streamingMessage && !streamingMessage.isComplete;
  const isLoading = useMessageStore((state) => state.isLoading);
  const error = useMessageStore((state) => state.error);

  // Register websocket handlers for receiving messages
  const registerHandlers = useCallback((conversationId: string) => {
    // Clear any existing handlers
    unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
    unsubscribeRefs.current = [];

    // Register handlers for incoming messages
    const unsubscribeContent = webSocketService.onMessage((chunk) => {
      console.log(
        "[useMessaging] Received content chunk:",
        chunk.substring(0, 50) + "..."
      );
      messageStore.updateStreamingMessage(conversationId, chunk);
    });

    const unsubscribeComplete = webSocketService.onComplete(() => {
      console.log("[useMessaging] Message complete");
      messageStore.completeStreamingMessage(conversationId);
    });

    const unsubscribeTerminated = webSocketService.onTerminated((reason) => {
      console.log("[useMessaging] Message terminated:", reason);

      // Get current state directly from the store
      const currentState = useMessageStore.getState();
      const streamingState = currentState.streamingMessages.get(conversationId);
      const currentMessages = currentState.messages.get(conversationId) || [];

      if (streamingState?.content.trim()) {
        // Add partial message with indicator
        const partialMessage: Message = {
          id: `temp-ai-partial-${Date.now()}`,
          conversation_id: conversationId,
          content: streamingState.content + "\n\n*[Response was cut off]*",
          sender: "assistant",
          conversation_sequence: currentMessages.length + 1,
          timestamp: new Date(),
        };
        messageStore.addMessage(conversationId, partialMessage);
      }

      messageStore.clearStreamingMessage(conversationId);

      Toast.show({
        type: "warning",
        text1: "Message Cut Off",
        text2: "Response was interrupted",
      });
    });

    const unsubscribeError = webSocketService.onError((error) => {
      console.error("[useMessaging] WebSocket error:", error);
      messageStore.clearStreamingMessage(conversationId);
      messageStore.setError(error);

      Toast.show({
        type: "error",
        text1: "Connection Error",
        text2: error.message || "WebSocket connection failed",
      });
    });

    // Store unsubscribe functions
    unsubscribeRefs.current = [
      unsubscribeContent,
      unsubscribeComplete,
      unsubscribeTerminated,
      unsubscribeError,
    ];

    console.log(
      "[useMessaging] Registered websocket handlers for conversation:",
      conversationId
    );
  }, []); // No dependencies - handlers get fresh state when they execute

  // Auto-connect websocket and register handlers when conversationId changes
  useEffect(() => {
    if (!conversationId) return;

    const connectAndRegister = async () => {
      try {
        console.log(
          "[useMessaging] Auto-connecting websocket for:",
          conversationId
        );
        await webSocketService.ensureConnection();

        // Register handlers immediately after connection for proactive messages
        registerHandlers(conversationId);
      } catch (error) {
        console.error("[useMessaging] Failed to auto-connect:", error);
        messageStore.setError(
          error instanceof Error ? error : new Error(String(error))
        );
      }
    };

    connectAndRegister();

    // Cleanup on unmount or conversation change
    return () => {
      unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
      unsubscribeRefs.current = [];
    };
  }, [conversationId, registerHandlers]);

  const loadMessages = useCallback(async () => {
    const currentConversationId =
      useUserSessionStore.getState().activeConversationId;
    if (!currentConversationId) {
      return [];
    }

    try {
      // Check if already loaded from preloading
      const currentState = useMessageStore.getState();
      const existingMessages = currentState.messages.get(currentConversationId);
      if (existingMessages && existingMessages.length > 0) {
        console.log("[useMessaging] Using preloaded messages");
        return existingMessages;
      }

      // Load from database
      messageStore.setLoading(true);
      const messages = await conversationService.getConversationMessages(
        currentConversationId
      );
      const sortedMessages = messages.sort(
        (a, b) => a.conversation_sequence - b.conversation_sequence
      );

      messageStore.setBulkMessages({
        [currentConversationId]: sortedMessages,
      });
      messageStore.setLoading(false);

      return sortedMessages;
    } catch (error) {
      messageStore.setError(
        error instanceof Error ? error : new Error(String(error))
      );
      messageStore.setLoading(false);
      throw error;
    }
  }, []);

  const sendMessage = useCallback(
    async (content: string, options?: { detailedAnalysis?: boolean }) => {
      const currentConversationId =
        useUserSessionStore.getState().activeConversationId;
      if (!currentConversationId) {
        throw new Error("No active conversation");
      }

      try {
        // Get fresh state for creating user message
        const currentState = useMessageStore.getState();
        const currentMessages =
          currentState.messages.get(currentConversationId) || [];

        // Add user message to local state
        const userMessage: Message = {
          id: `temp-user-${Date.now()}`,
          conversation_id: currentConversationId,
          content,
          sender: "user",
          conversation_sequence: currentMessages.length + 1,
          timestamp: new Date(),
        };
        messageStore.addMessage(currentConversationId, userMessage);

        // Build payload with fresh data
        const updatedMessages =
          useMessageStore.getState().messages.get(currentConversationId) || [];
        const analysisResult = useWorkoutAnalysisStore.getState().getResult();
        const analysisBundles = useAnalysisBundleStore
          .getState()
          .getBundlesByConversation(currentConversationId);

        const payload = {
          message: content,
          conversation_history: updatedMessages,
          analysis_bundle: analysisResult,
          analysis_bundles: analysisBundles,
          generate_graph: options?.detailedAnalysis || false,
        };

        // Re-register handlers (in case they were cleared)
        registerHandlers(currentConversationId);

        // Connect and send
        await webSocketService.ensureConnection();
        webSocketService.sendMessage(payload);
      } catch (error) {
        console.error("Error sending message:", error);
        const errorMessage =
          error instanceof Error ? error : new Error(String(error));

        Toast.show({
          type: "error",
          text1: "Send Failed",
          text2: errorMessage.message,
        });

        messageStore.setError(errorMessage);
        throw errorMessage;
      }
    },
    [registerHandlers]
  );

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
