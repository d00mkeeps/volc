import { useCallback, useEffect, useRef, useState } from "react";
import { useMessageStore } from "@/stores/chat/MessageStore";
import { getWebSocketService } from "@/services/websocket/WebSocketService";
import { authService } from "@/services/db/auth";
import { Message } from "@/types";
import Toast from "react-native-toast-message";
import type { ConnectionState } from "@/services/websocket/WebSocketService";

const EMPTY_MESSAGES: Message[] = [];
const PLANNING_KEY = "workout-planning";

export function useWorkoutPlanning() {
  const webSocketService = getWebSocketService();
  const unsubscribeRefs = useRef<(() => void)[]>([]);
  const templateApprovalCallbackRef = useRef<
    ((templateData: any) => void) | null
  >(null);

  // Track if we've done initial connection (prevents reconnection loop)
  const hasInitializedRef = useRef(false);

  // Track connection state
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    webSocketService.getConnectionState()
  );

  // Use user_id as the key since no conversationId for planning
  const getUserId = async () => {
    const session = await authService.getSession();
    return session?.user?.id || null;
  };

  // State selectors - use 'workout-planning' as key
  const messages = useMessageStore((state) => {
    return state.messages?.get(PLANNING_KEY) || EMPTY_MESSAGES;
  });

  const streamingMessage = useMessageStore((state) => {
    return state.streamingMessages?.get(PLANNING_KEY) || null;
  });

  const isStreaming = !!streamingMessage && !streamingMessage.isComplete;
  const isLoading = useMessageStore((state) => state.isLoading);
  const error = useMessageStore((state) => state.error);

  const setTemplateApprovalHandler = useCallback(
    (handler: (templateData: any) => void) => {
      templateApprovalCallbackRef.current = handler;
    },
    []
  );

  // Method: /hooks/chat/useWorkoutPlanning.registerHandlers
  // Register websocket handlers for receiving messages
  const registerHandlers = useCallback(
    (messageKey: string) => {
      // Clear any existing handlers
      unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
      unsubscribeRefs.current = [];

      const unsubscribeTemplateApproved =
        webSocketService.onWorkoutTemplateApproved((templateData) => {
          console.log(
            "[useWorkoutPlanning] Workout template approved:",
            templateData
          );
          if (templateApprovalCallbackRef.current) {
            templateApprovalCallbackRef.current(templateData);
          }
        });

      // Register handlers for incoming messages
      const unsubscribeContent = webSocketService.onMessage((chunk) => {
        console.log(
          "[useWorkoutPlanning] Received content chunk:",
          chunk.substring(0, 50) + "..."
        );
        useMessageStore.getState().updateStreamingMessage(messageKey, chunk);
      });

      const unsubscribeComplete = webSocketService.onComplete(() => {
        console.log("[useWorkoutPlanning] Message complete");
        useMessageStore.getState().completeStreamingMessage(messageKey);
      });

      const unsubscribeTerminated = webSocketService.onTerminated((reason) => {
        console.log("[useWorkoutPlanning] Message terminated:", reason);
        useMessageStore.getState().clearStreamingMessage(messageKey);
        Toast.show({
          type: "warning",
          text1: "Message Cut Off",
          text2: "Response was interrupted",
        });
      });

      const unsubscribeError = webSocketService.onError((error) => {
        console.error("[useWorkoutPlanning] WebSocket error:", error);
        useMessageStore.getState().clearStreamingMessage(messageKey);
        useMessageStore.getState().setError(error);
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
        unsubscribeTemplateApproved,
      ];

      console.log(
        "[useWorkoutPlanning] Registered websocket handlers for planning"
      );
    },
    [webSocketService]
  );

  // Method: /hooks/chat/useWorkoutPlanning.checkConnectionState
  // Monitor connection state changes
  useEffect(() => {
    const checkConnectionState = () => {
      const newState = webSocketService.getConnectionState();

      // Only update state if it actually changed (prevents infinite loop)
      setConnectionState((prevState) => {
        if (prevState !== newState) {
          console.log(
            `[useWorkoutPlanning] Connection state changed: ${prevState} → ${newState}`
          );
          return newState;
        }
        return prevState;
      });
    };

    // Check immediately and set up polling
    checkConnectionState();
    const interval = setInterval(checkConnectionState, 500);

    return () => clearInterval(interval);
  }, [webSocketService]);

  // Method: /hooks/chat/useWorkoutPlanning.handleDisconnection
  // Separate effect to handle disconnection side effects
  useEffect(() => {
    if (connectionState === "disconnected") {
      console.log("[useWorkoutPlanning] Disconnected - clearing messages");
      // Use getState() to avoid dependency on the store
      useMessageStore.getState().clearMessages(PLANNING_KEY);
      useMessageStore.getState().clearStreamingMessage(PLANNING_KEY);
    }
  }, [connectionState]); // Only depend on connectionState, not messageStore

  // Method: /hooks/chat/useWorkoutPlanning.connectToPlanning
  // Single-use initial connection - only runs ONCE on mount
  useEffect(() => {
    // Skip if already initialized
    if (hasInitializedRef.current) {
      console.log(
        "[useWorkoutPlanning] Already initialized, skipping auto-connect"
      );
      return;
    }

    const connectToPlanning = async () => {
      try {
        console.log(
          "[useWorkoutPlanning] Initial connection to workout planning"
        );
        hasInitializedRef.current = true;

        // Connect to workout-planning endpoint
        await webSocketService.ensureConnection({
          type: "workout-planning",
        });

        // Register handlers
        registerHandlers(PLANNING_KEY);
      } catch (error) {
        console.error("[useWorkoutPlanning] Failed to connect:", error);
        hasInitializedRef.current = false; // Reset on error so retry is possible
        useMessageStore
          .getState()
          .setError(error instanceof Error ? error : new Error(String(error)));
      }
    };

    connectToPlanning();

    // Cleanup on unmount
    return () => {
      unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
      unsubscribeRefs.current = [];
    };
  }, [registerHandlers, webSocketService]);

  // Method: /hooks/chat/useWorkoutPlanning.sendMessage
  const sendMessage = useCallback(
    async (content: string) => {
      try {
        // Get current messages for this planning session
        const currentState = useMessageStore.getState();
        const currentMessages = currentState.messages.get(PLANNING_KEY) || [];

        // Add user message to local state
        const userMessage: Message = {
          id: `temp-user-${Date.now()}`,
          conversation_id: PLANNING_KEY,
          content,
          sender: "user",
          conversation_sequence: currentMessages.length + 1,
          timestamp: new Date(),
        };
        useMessageStore.getState().addMessage(PLANNING_KEY, userMessage);

        // Build simple payload for planning
        const updatedMessages =
          useMessageStore.getState().messages.get(PLANNING_KEY) || [];
        const payload = {
          message: content,
          conversation_history: updatedMessages,
        };

        // Re-register handlers and send
        registerHandlers(PLANNING_KEY);
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

        useMessageStore.getState().setError(errorMessage);
        throw errorMessage;
      }
    },
    [registerHandlers, webSocketService]
  );

  // Method: /hooks/chat/useWorkoutPlanning.restartChat
  const restartChat = useCallback(async () => {
    try {
      console.log(
        "[useWorkoutPlanning] Restarting chat - clearing and reconnecting"
      );

      // Clear messages and streaming state
      useMessageStore.getState().clearMessages(PLANNING_KEY);
      useMessageStore.getState().clearStreamingMessage(PLANNING_KEY);
      useMessageStore.getState().setError(null);

      // Reconnect
      await webSocketService.ensureConnection({ type: "workout-planning" });
      registerHandlers(PLANNING_KEY);

      Toast.show({
        type: "success",
        text1: "Chat Restarted",
        text2: "Ready for a new conversation",
      });
    } catch (error) {
      console.error("[useWorkoutPlanning] Failed to restart chat:", error);
      Toast.show({
        type: "error",
        text1: "Restart Failed",
        text2: "Could not reconnect to chat",
      });
    }
  }, [webSocketService, registerHandlers]);

  return {
    messages,
    streamingMessage,
    isStreaming,
    isLoading,
    error,
    connectionState,
    sendMessage,
    restartChat,
    hasMessages: messages.length > 0,
    messageCount: messages.length,
    setTemplateApprovalHandler,
  };
}
