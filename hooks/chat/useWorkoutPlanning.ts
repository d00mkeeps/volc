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
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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
      // ✅ Add guard to prevent duplicate registration
      if (unsubscribeRefs.current.length > 0) {
        console.log(
          "[useWorkoutPlanning] Handlers already registered, clearing first"
        );
        unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
        unsubscribeRefs.current = [];
      }

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
        setStatusMessage(null);
        useMessageStore.getState().completeStreamingMessage(messageKey);
      });

      const unsubscribeTerminated = webSocketService.onTerminated((reason) => {
        console.log("[useWorkoutPlanning] Message terminated:", reason);
        setStatusMessage(null);
        useMessageStore.getState().clearStreamingMessage(messageKey);
        Toast.show({
          type: "warning",
          text1: "Message Cut Off",
          text2: "Response was interrupted",
        });
      });

      const unsubscribeError = webSocketService.onError((error) => {
        console.error("[useWorkoutPlanning] WebSocket error:", error);
        setStatusMessage(null);
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
        unsubscribeStatus,
      ];

      console.log(
        `[useWorkoutPlanning] Registered ${unsubscribeRefs.current.length} websocket handlers for planning`
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
      console.log("[useWorkoutPlanning] Disconnected state detected");
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

      registerHandlers(PLANNING_KEY);

      await webSocketService.ensureConnection({
        type: "workout-planning",
      });

      // ✅ Automatically send greeting trigger to let backend check for history
      const currentMessages =
        useMessageStore.getState().messages.get(PLANNING_KEY) || [];

      console.log(
        `[useWorkoutPlanning] Sending greeting trigger with ${currentMessages.length} messages in history`
      );

      webSocketService.sendMessage({
        type: "message",
        message: "__GREETING_TRIGGER__",
        conversation_history: currentMessages,
      });
    } catch (error) {
      console.error("[useWorkoutPlanning] Failed to connect:", error);
      isConnectedRef.current = false;

      unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
      unsubscribeRefs.current = [];

      useMessageStore
        .getState()
        .setError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [registerHandlers, webSocketService]);

  // MANUAL disconnect method - call this when modal closes
  const disconnect = useCallback(() => {
    console.log("[useWorkoutPlanning] Disconnecting from workout planning");

    console.log(
      `[useWorkoutPlanning] Unsubscribing ${unsubscribeRefs.current.length} handlers`
    );
    unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
    unsubscribeRefs.current = [];
    isConnectedRef.current = false;

    // ✅ Clear messages when explicitly disconnecting (modal close)
    useMessageStore.getState().clearMessages(PLANNING_KEY);
    useMessageStore.getState().clearStreamingMessage(PLANNING_KEY);
    setStatusMessage(null);

    webSocketService.setDisconnectReason("user_initiated");
    webSocketService.disconnect();
  }, [webSocketService]);

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

        // ✅ Auto-reconnect if disconnected (handles inactivity timeout)
        if (!webSocketService.isConnected()) {
          console.log(
            "[useWorkoutPlanning] Disconnected - reconnecting before sending message"
          );
          await webSocketService.ensureConnection({ type: "workout-planning" });
          registerHandlers(PLANNING_KEY);

          // Send greeting trigger on reconnection
          const messagesForReconnect =
            useMessageStore.getState().messages.get(PLANNING_KEY) || [];
          webSocketService.sendMessage({
            type: "message",
            message: "__GREETING_TRIGGER__",
            conversation_history: messagesForReconnect,
          });
        }

        const updatedMessages =
          useMessageStore.getState().messages.get(PLANNING_KEY) || [];
        const payload = {
          type: "message",
          message: content,
          conversation_history: updatedMessages,
        };

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
    [webSocketService, registerHandlers]
  );

  const restartChat = useCallback(async () => {
    try {
      console.log(
        "[useWorkoutPlanning] Restarting chat - clearing and reconnecting"
      );

      useMessageStore.getState().clearMessages(PLANNING_KEY);
      useMessageStore.getState().clearStreamingMessage(PLANNING_KEY);
      useMessageStore.getState().setError(null);

      await webSocketService.ensureConnection({ type: "workout-planning" });

      // Send greeting trigger for fresh start
      webSocketService.sendMessage({
        type: "message",
        message: "__GREETING_TRIGGER__",
        conversation_history: [],
      });

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
  }, [webSocketService]);

  return {
    messages,
    streamingMessage,
    isStreaming,
    statusMessage,
    isLoading,
    error,
    connectionState,
    connect,
    disconnect,
    sendMessage,
    restartChat,
    hasMessages: messages.length > 0,
    messageCount: messages.length,
    setTemplateApprovalHandler,
  };
}
