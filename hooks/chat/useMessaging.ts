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

export function useMessaging(isActive: boolean = true) {
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
  const registerHandlers = useCallback(
    (conversationId: string) => {
      // ✅ Check for active streams
      const messageStore = useMessageStore.getState();
      const activeStreams = Array.from(
        messageStore.streamingMessages.entries()
      ).filter(([_, msg]) => msg && !msg.isComplete);

      if (activeStreams.length > 0) {
        console.warn(
          "[useMessaging] ⚠️ Active streams detected:",
          activeStreams.map(([key]) => key)
        );
        // For useMessaging, we're stricter - don't clear if actively streaming
        // Just log and proceed with registration (defensive handlers will protect)
      } else {
        // ✅ Only do nuclear cleanup if nothing is streaming
        console.log(
          "[useMessaging] 🧹 Removing ALL websocket listeners (no active streams)"
        );
        webSocketService.removeAllListeners();
      }

      // ✅ Clear our own refs
      unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
      unsubscribeRefs.current = [];

      // ✅ Register handlers with defensive conversation ID check
      const unsubscribeContent = webSocketService.onMessage((chunk) => {
        const activeConvId =
          useUserSessionStore.getState().activeConversationId;
        if (activeConvId === conversationId) {
          console.log(
            "[useMessaging] ✅ Received content chunk for active conversation:",
            conversationId
          );
          messageStore.updateStreamingMessage(conversationId, chunk);
        } else {
          console.log(
            "[useMessaging] ⏭️ Ignoring chunk for inactive conversation. Active:",
            activeConvId,
            "Received for:",
            conversationId
          );
        }
      });

      const unsubscribeComplete = webSocketService.onComplete(() => {
        const activeConvId =
          useUserSessionStore.getState().activeConversationId;
        if (activeConvId === conversationId) {
          console.log(
            "[useMessaging] ✅ Message complete for:",
            conversationId
          );
          messageStore.completeStreamingMessage(conversationId);
        }
      });

      const unsubscribeTerminated = webSocketService.onTerminated((reason) => {
        const activeConvId =
          useUserSessionStore.getState().activeConversationId;
        if (activeConvId !== conversationId) {
          return;
        }

        console.log("[useMessaging] Message terminated:", reason);

        // Get current state directly from the store
        const currentState = useMessageStore.getState();
        const streamingState =
          currentState.streamingMessages.get(conversationId);
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
        "[useMessaging] ✅ Registered websocket handlers for conversation:",
        conversationId
      );
    },
    [webSocketService, messageStore]
  );

  // Auto-connect websocket and register handlers ONLY when active
  useEffect(() => {
    if (!conversationId) {
      return;
    }

    // If inactive, clean up handlers
    if (!isActive) {
      if (unsubscribeRefs.current.length > 0) {
        console.log(
          `[useMessaging] Component inactive - unregistering handlers for ${conversationId}`
        );
        unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
        unsubscribeRefs.current = [];
      }
      return;
    }

    // Active - connect and register
    const connectAndRegister = async () => {
      try {
        console.log(
          "[useMessaging] Auto-connecting websocket for:",
          conversationId
        );
        await webSocketService.ensureConnection({ type: "coach" });

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

    // Cleanup on unmount, conversation change, or becoming inactive
    return () => {
      console.log(
        `[useMessaging] Cleanup for conversation: ${conversationId}, isActive: ${isActive}`
      );
      unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
      unsubscribeRefs.current = [];
    };
  }, [
    conversationId,
    isActive,
    registerHandlers,
    webSocketService,
    messageStore,
  ]);

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
  }, [messageStore]);

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

        // Connect and send (handlers already registered in useEffect)
        await webSocketService.ensureConnection({ type: "coach" });
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
    [messageStore, webSocketService]
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
