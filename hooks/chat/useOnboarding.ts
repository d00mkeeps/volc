// /hooks/onboarding/useOnboarding.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { useMessageStore } from "@/stores/chat/MessageStore";
import { getWebSocketService } from "@/services/websocket/WebSocketService";
import { Message } from "@/types";
import Toast from "react-native-toast-message";
import type { ConnectionState } from "@/services/websocket/WebSocketService";

const EMPTY_MESSAGES: Message[] = [];
const ONBOARDING_KEY = "onboarding";

export function useOnboarding() {
  const webSocketService = getWebSocketService();
  const unsubscribeRefs = useRef<(() => void)[]>([]);
  const isConnectedRef = useRef(false);

  // Track connection state
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    webSocketService.getConnectionState()
  );

  // State selectors
  const messages = useMessageStore((state) => {
    return state.messages?.get(ONBOARDING_KEY) || EMPTY_MESSAGES;
  });

  const streamingMessage = useMessageStore((state) => {
    return state.streamingMessages?.get(ONBOARDING_KEY) || null;
  });

  const isStreaming = !!streamingMessage && !streamingMessage.isComplete;
  const isLoading = useMessageStore((state) => state.isLoading);
  const error = useMessageStore((state) => state.error);

  // /hooks/onboarding/useOnboarding.doRegisterHandlers
  const doRegisterHandlers = useCallback(
    (messageKey: string) => {
      console.log("[useOnboarding] 🧹 Removing ALL websocket listeners");
      webSocketService.removeAllListeners();

      unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
      unsubscribeRefs.current = [];

      // Register fresh handlers
      const unsubscribeContent = webSocketService.onMessage((chunk) => {
        console.log("[useOnboarding] Received content chunk");
        useMessageStore.getState().updateStreamingMessage(messageKey, chunk);
      });

      const unsubscribeComplete = webSocketService.onComplete(() => {
        console.log("[useOnboarding] Message complete");
        useMessageStore.getState().completeStreamingMessage(messageKey);
      });

      const unsubscribeTerminated = webSocketService.onTerminated((reason) => {
        console.log("[useOnboarding] Message terminated:", reason);
        useMessageStore.getState().clearStreamingMessage(messageKey);
        Toast.show({
          type: "warning",
          text1: "Message Cut Off",
          text2: "Response was interrupted",
        });
      });

      const unsubscribeError = webSocketService.onError((error) => {
        console.error("[useOnboarding] WebSocket error:", error);
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
      ];

      console.log(
        `[useOnboarding] ✅ Registered ${unsubscribeRefs.current.length} fresh websocket handlers`
      );
    },
    [webSocketService]
  );

  // /hooks/onboarding/useOnboarding.registerHandlers
  const registerHandlers = useCallback(
    async (messageKey: string) => {
      const messageStore = useMessageStore.getState();
      const activeStreams = Array.from(
        messageStore.streamingMessages.entries()
      ).filter(([_, msg]) => msg && !msg.isComplete);

      if (activeStreams.length > 0) {
        console.warn(
          "[useOnboarding] ⚠️ Active streams detected, waiting for completion:",
          activeStreams.map(([key]) => key)
        );

        await new Promise<void>((resolve) => {
          const checkInterval = setInterval(() => {
            const stillStreaming = Array.from(
              useMessageStore.getState().streamingMessages.entries()
            ).filter(([_, msg]) => msg && !msg.isComplete);

            if (stillStreaming.length === 0) {
              clearInterval(checkInterval);
              console.log("[useOnboarding] ✅ Streams completed");
              resolve();
            }
          }, 100);

          setTimeout(() => {
            clearInterval(checkInterval);
            console.warn("[useOnboarding] ⏱️ Timeout waiting for streams");
            resolve();
          }, 5000);
        });
      }

      doRegisterHandlers(messageKey);
    },
    [doRegisterHandlers]
  );

  // Monitor connection state changes
  useEffect(() => {
    const checkConnectionState = () => {
      const newState = webSocketService.getConnectionState();
      setConnectionState((prevState) => {
        if (prevState !== newState) {
          console.log(
            `[useOnboarding] Connection state changed: ${prevState} → ${newState}`
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
      console.log("[useOnboarding] Disconnected state detected");
      isConnectedRef.current = false;
    }
  }, [connectionState]);

  // /hooks/onboarding/useOnboarding.connect
  const connect = useCallback(async () => {
    if (isConnectedRef.current) {
      console.log("[useOnboarding] Already connected, skipping");
      return;
    }

    try {
      console.log("[useOnboarding] Connecting to onboarding");
      isConnectedRef.current = true;

      await registerHandlers(ONBOARDING_KEY);

      await webSocketService.ensureConnection({
        type: "onboarding",
      });

      const currentMessages =
        useMessageStore.getState().messages.get(ONBOARDING_KEY) || [];

      console.log(
        `[useOnboarding] Sending greeting trigger with ${currentMessages.length} messages in history`
      );

      // Send greeting trigger to initiate backend's first-message check
      // Backend will send greeting if conversation_history is empty, then skip this trigger message
      webSocketService.sendMessage({
        type: "message",
        message: "__GREETING_TRIGGER__", // Must match backend pattern!
        conversation_history: currentMessages,
      });
    } catch (error) {
      console.error("[useOnboarding] Failed to connect:", error);
      isConnectedRef.current = false;

      unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
      unsubscribeRefs.current = [];

      useMessageStore
        .getState()
        .setError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [registerHandlers, webSocketService]);

  // /hooks/onboarding/useOnboarding.disconnect
  const disconnect = useCallback(() => {
    console.log("[useOnboarding] Disconnecting from onboarding");

    unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
    unsubscribeRefs.current = [];
    isConnectedRef.current = false;

    // Clear messages when disconnecting
    useMessageStore.getState().clearMessages(ONBOARDING_KEY);
    useMessageStore.getState().clearStreamingMessage(ONBOARDING_KEY);

    webSocketService.setDisconnectReason("user_initiated");
    webSocketService.disconnect();
  }, [webSocketService]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // /hooks/onboarding/useOnboarding.sendMessage
  const sendMessage = useCallback(
    async (content: string) => {
      try {
        const currentState = useMessageStore.getState();
        const currentMessages = currentState.messages.get(ONBOARDING_KEY) || [];

        const userMessage: Message = {
          id: `temp-user-${Date.now()}`,
          conversation_id: ONBOARDING_KEY,
          content,
          sender: "user",
          conversation_sequence: currentMessages.length + 1,
          timestamp: new Date(),
        };
        useMessageStore.getState().addMessage(ONBOARDING_KEY, userMessage);

        // Auto-reconnect if disconnected
        if (!webSocketService.isConnected()) {
          console.log(
            "[useOnboarding] Disconnected - reconnecting before sending"
          );

          await webSocketService.ensureConnection({
            type: "onboarding",
          });
          await registerHandlers(ONBOARDING_KEY);

          const messagesForReconnect =
            useMessageStore.getState().messages.get(ONBOARDING_KEY) || [];

          // Send greeting trigger on reconnection
          // Backend will restore history and skip the trigger
          webSocketService.sendMessage({
            type: "message",
            message: "__GREETING_TRIGGER__", // Must match backend pattern!
            conversation_history: messagesForReconnect,
          });
        }

        const updatedMessages =
          useMessageStore.getState().messages.get(ONBOARDING_KEY) || [];
        const payload = {
          type: "message",
          message: content,
          conversation_history: updatedMessages,
        };

        await webSocketService.ensureConnection({
          type: "onboarding",
        });
        webSocketService.sendMessage(payload);
      } catch (error) {
        console.error("[useOnboarding] Error sending message:", error);
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

  return {
    messages,
    streamingMessage,
    isStreaming,
    isLoading,
    error,
    connectionState,
    connect,
    disconnect,
    sendMessage,
    hasMessages: messages.length > 0,
    messageCount: messages.length,
  };
}
