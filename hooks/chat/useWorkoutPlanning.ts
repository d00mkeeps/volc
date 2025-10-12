import { useCallback, useEffect, useRef, useState } from "react";
import { useMessageStore } from "@/stores/chat/MessageStore";
import { getWebSocketService } from "@/services/websocket/WebSocketService";
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

  const isConnectedRef = useRef(false);

  // Track connection state
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    webSocketService.getConnectionState()
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null); // ← ADD THIS

  // State selectors
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

      const unsubscribeStatus = webSocketService.onStatus((statusText) => {
        // ← ADD THIS
        console.log("[useWorkoutPlanning] Status update:", statusText);
        setStatusMessage(statusText);
      });

      const unsubscribeContent = webSocketService.onMessage((chunk) => {
        console.log(
          "[useWorkoutPlanning] Received content chunk:",
          chunk.substring(0, 50) + "..."
        );
        useMessageStore.getState().updateStreamingMessage(messageKey, chunk);
      });

      const unsubscribeComplete = webSocketService.onComplete(() => {
        console.log("[useWorkoutPlanning] Message complete");
        setStatusMessage(null); // ← ADD THIS - clear status on complete
        useMessageStore.getState().completeStreamingMessage(messageKey);
      });

      const unsubscribeTerminated = webSocketService.onTerminated((reason) => {
        console.log("[useWorkoutPlanning] Message terminated:", reason);
        setStatusMessage(null); // ← ADD THIS - clear status on terminated
        useMessageStore.getState().clearStreamingMessage(messageKey);
        Toast.show({
          type: "warning",
          text1: "Message Cut Off",
          text2: "Response was interrupted",
        });
      });

      const unsubscribeError = webSocketService.onError((error) => {
        console.error("[useWorkoutPlanning] WebSocket error:", error);
        setStatusMessage(null); // ← ADD THIS - clear status on error
        useMessageStore.getState().clearStreamingMessage(messageKey);
        useMessageStore.getState().setError(error);
        Toast.show({
          type: "error",
          text1: "Connection Error",
          text2: error.message || "WebSocket connection failed",
        });
      });

      unsubscribeRefs.current = [
        unsubscribeContent,
        unsubscribeComplete,
        unsubscribeTerminated,
        unsubscribeError,
        unsubscribeTemplateApproved,
        unsubscribeStatus, // ← ADD THIS
      ];

      console.log(
        "[useWorkoutPlanning] Registered websocket handlers for planning"
      );
    },
    [webSocketService]
  );

  // Monitor connection state changes
  useEffect(() => {
    const checkConnectionState = () => {
      const newState = webSocketService.getConnectionState();
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

    checkConnectionState();
    const interval = setInterval(checkConnectionState, 500);

    return () => clearInterval(interval);
  }, [webSocketService]);

  // Handle disconnection side effects
  useEffect(() => {
    if (connectionState === "disconnected") {
      console.log("[useWorkoutPlanning] Disconnected - clearing messages");
      useMessageStore.getState().clearMessages(PLANNING_KEY);
      useMessageStore.getState().clearStreamingMessage(PLANNING_KEY);
      isConnectedRef.current = false;
    }
  }, [connectionState]);

  // MANUAL connect method - call this when modal opens
  const connect = useCallback(async () => {
    if (isConnectedRef.current) {
      console.log("[useWorkoutPlanning] Already connected, skipping");
      return;
    }

    try {
      console.log("[useWorkoutPlanning] Connecting to workout planning");
      isConnectedRef.current = true;

      await webSocketService.ensureConnection({
        type: "workout-planning",
      });

      registerHandlers(PLANNING_KEY);
    } catch (error) {
      console.error("[useWorkoutPlanning] Failed to connect:", error);
      isConnectedRef.current = false;
      useMessageStore
        .getState()
        .setError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [registerHandlers, webSocketService]);

  // MANUAL disconnect method - call this when modal closes
  const disconnect = useCallback(() => {
    console.log("[useWorkoutPlanning] Disconnecting from workout planning");
    unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
    unsubscribeRefs.current = [];
    isConnectedRef.current = false;

    // Clear messages when disconnecting
    useMessageStore.getState().clearMessages(PLANNING_KEY);
    useMessageStore.getState().clearStreamingMessage(PLANNING_KEY);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const sendMessage = useCallback(
    async (content: string) => {
      try {
        const currentState = useMessageStore.getState();
        const currentMessages = currentState.messages.get(PLANNING_KEY) || [];

        const userMessage: Message = {
          id: `temp-user-${Date.now()}`,
          conversation_id: PLANNING_KEY,
          content,
          sender: "user",
          conversation_sequence: currentMessages.length + 1,
          timestamp: new Date(),
        };
        useMessageStore.getState().addMessage(PLANNING_KEY, userMessage);

        const updatedMessages =
          useMessageStore.getState().messages.get(PLANNING_KEY) || [];
        const payload = {
          message: content,
          conversation_history: updatedMessages,
        };

        // Just ensure connection and send - handlers already registered from connect()
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
    [webSocketService] // Remove registerHandlers from deps
  );

  const restartChat = useCallback(async () => {
    try {
      console.log(
        "[useWorkoutPlanning] Restarting chat - clearing and reconnecting"
      );

      useMessageStore.getState().clearMessages(PLANNING_KEY);
      useMessageStore.getState().clearStreamingMessage(PLANNING_KEY);
      useMessageStore.getState().setError(null);

      // Just ensure connection - handlers already registered from connect()
      await webSocketService.ensureConnection({ type: "workout-planning" });

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
  }, [webSocketService]); // Remove registerHandlers from deps

  return {
    messages,
    streamingMessage,
    isStreaming,
    statusMessage,
    isLoading,
    error,
    connectionState,
    connect, // NEW - manual connect
    disconnect, // NEW - manual disconnect
    sendMessage,
    restartChat,
    hasMessages: messages.length > 0,
    messageCount: messages.length,
    setTemplateApprovalHandler,
  };
}
