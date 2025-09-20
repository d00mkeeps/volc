import { useCallback, useEffect, useRef } from "react";
import { useMessageStore } from "@/stores/chat/MessageStore";
import { getWebSocketService } from "@/services/websocket/WebSocketService";
import { authService } from "@/services/db/auth";
import { Message } from "@/types";
import Toast from "react-native-toast-message";

const EMPTY_MESSAGES: Message[] = [];

export function useWorkoutPlanning() {
  const messageStore = useMessageStore();
  const webSocketService = getWebSocketService();
  const unsubscribeRefs = useRef<(() => void)[]>([]);

  // Use user_id as the key since no conversationId for planning
  const getUserId = async () => {
    const session = await authService.getSession();
    return session?.user?.id || null;
  };

  // State selectors - use user_id as key
  const messages = useMessageStore((state) => {
    // For planning, we'll use 'workout-planning' as the key
    const planningKey = "workout-planning";
    return state.messages?.get(planningKey) || EMPTY_MESSAGES;
  });

  const streamingMessage = useMessageStore((state) => {
    const planningKey = "workout-planning";
    return state.streamingMessages?.get(planningKey) || null;
  });

  const isStreaming = !!streamingMessage && !streamingMessage.isComplete;
  const isLoading = useMessageStore((state) => state.isLoading);
  const error = useMessageStore((state) => state.error);

  // Register websocket handlers for receiving messages
  const registerHandlers = useCallback((messageKey: string) => {
    // Clear any existing handlers
    unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
    unsubscribeRefs.current = [];

    // Register handlers for incoming messages
    const unsubscribeContent = webSocketService.onMessage((chunk) => {
      console.log(
        "[useWorkoutPlanning] Received content chunk:",
        chunk.substring(0, 50) + "..."
      );
      messageStore.updateStreamingMessage(messageKey, chunk);
    });

    const unsubscribeComplete = webSocketService.onComplete(() => {
      console.log("[useWorkoutPlanning] Message complete");
      messageStore.completeStreamingMessage(messageKey);
    });

    const unsubscribeTerminated = webSocketService.onTerminated((reason) => {
      console.log("[useWorkoutPlanning] Message terminated:", reason);
      messageStore.clearStreamingMessage(messageKey);
      Toast.show({
        type: "warning",
        text1: "Message Cut Off",
        text2: "Response was interrupted",
      });
    });

    const unsubscribeError = webSocketService.onError((error) => {
      console.error("[useWorkoutPlanning] WebSocket error:", error);
      messageStore.clearStreamingMessage(messageKey);
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
      "[useWorkoutPlanning] Registered websocket handlers for planning"
    );
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    const connectToPlanning = async () => {
      try {
        console.log("[useWorkoutPlanning] Auto-connecting to workout planning");

        // Connect to workout-planning endpoint
        await webSocketService.ensureConnection({
          type: "workout-planning",
        });

        // Register handlers
        registerHandlers("workout-planning");
      } catch (error) {
        console.error("[useWorkoutPlanning] Failed to connect:", error);
        messageStore.setError(
          error instanceof Error ? error : new Error(String(error))
        );
      }
    };

    connectToPlanning();

    // Cleanup on unmount
    return () => {
      unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
      unsubscribeRefs.current = [];
    };
  }, [registerHandlers]);

  const sendMessage = useCallback(
    async (content: string) => {
      const messageKey = "workout-planning";

      try {
        // Get current messages for this planning session
        const currentState = useMessageStore.getState();
        const currentMessages = currentState.messages.get(messageKey) || [];

        // Add user message to local state
        const userMessage: Message = {
          id: `temp-user-${Date.now()}`,
          conversation_id: messageKey, // Use planning key as conversation_id
          content,
          sender: "user",
          conversation_sequence: currentMessages.length + 1,
          timestamp: new Date(),
        };
        messageStore.addMessage(messageKey, userMessage);

        // Build simple payload for planning
        const updatedMessages =
          useMessageStore.getState().messages.get(messageKey) || [];
        const payload = {
          message: content,
          conversation_history: updatedMessages,
          // No analysis bundles needed for planning
        };

        // Re-register handlers and send
        registerHandlers(messageKey);
        await webSocketService.ensureConnection({ type: "workout-planning" });
        webSocketService.sendMessage(payload);
      } catch (error) {
        console.error("Error sending planning message:", error);
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
    hasMessages: messages.length > 0,
    messageCount: messages.length,
  };
}
