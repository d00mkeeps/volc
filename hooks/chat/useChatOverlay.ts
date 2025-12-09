import { useCallback, useEffect, useRef, useState } from "react";
import { useMessageStore } from "@/stores/chat/MessageStore";
import { useConversationStore } from "@/stores/chat/ConversationStore";
import { getWebSocketService } from "@/services/websocket/WebSocketService";
import { Message } from "@/types";
import Toast from "react-native-toast-message";
import { Animated } from "react-native";
import { useUserStore } from "@/stores/userProfileStore";
import type { ConnectionState } from "@/services/websocket/WebSocketService";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { convertTemplateToWorkout } from "@/utils/workout/templateConversion";

const EMPTY_MESSAGES: Message[] = [];

export function useChatOverlay() {
  const webSocketService = getWebSocketService();
  const unsubscribeRefs = useRef<(() => void)[]>([]);

  const isConnectedRef = useRef(false);

  // Track connection state
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    webSocketService.getConnectionState()
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Connect to Conversation Store
  const activeConversationId = useConversationStore(
    (state) => state.activeConversationId
  );
  const checkTimeout = useConversationStore((state) => state.checkTimeout);

  const touchConversation = useConversationStore((state) => state.touchConversation);

  // Access messages via active ID
  const messages = useMessageStore(
    (state) => (activeConversationId ? state.messages.get(activeConversationId) : undefined) || EMPTY_MESSAGES
  );
  
  const streamingMessage = useMessageStore(
    (state) => activeConversationId ? state.streamingMessages.get(activeConversationId) : undefined
  );

  const [opacity] = useState(new Animated.Value(0));
  const { userProfile } = useUserStore(); // Get user profile

  const isStreaming = !!streamingMessage && !streamingMessage.isComplete;
  const isLoading = useMessageStore((state) => state.isLoading);
  const error = useMessageStore((state) => state.error);

  // Check timeout every minute
  useEffect(() => {
    // Check immediately on mount
    checkTimeout();
    
    // Then every minute
    const interval = setInterval(() => {
        checkTimeout();
    }, 60000); // 1 minute (test) or 60 minutes
    
    return () => clearInterval(interval);
  }, [checkTimeout]);

  // Extract actual registration logic
  const doRegisterHandlers = useCallback(
    (messageKey: string) => {
      // ✅ Nuclear cleanup - remove ALL handlers
      console.log("[useChatOverlay] 🧹 Removing ALL websocket listeners");
      webSocketService.removeAllListeners();

      // ✅ Clear our own refs
      unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
      unsubscribeRefs.current = [];

      // ✅ Register fresh handlers
      const unsubscribeStatus = webSocketService.onStatus((statusText) => {
        console.log("[useChatOverlay] Status update:", statusText);
        setStatusMessage(statusText);
      });

      const unsubscribeContent = webSocketService.onMessage((chunk) => {
        console.log(
          "[useChatOverlay] Received content chunk:",
          chunk.substring(0, 50) + "..."
        );
        useMessageStore.getState().updateStreamingMessage(messageKey, chunk);
      });

      const unsubscribeComplete = webSocketService.onComplete(() => {
        console.log("[useChatOverlay] Message complete");
        setStatusMessage(null);
        useMessageStore.getState().completeStreamingMessage(messageKey);
        
        // Refresh suggested actions for the Home Screen since context has changed
        useConversationStore.getState().fetchSuggestedActions();
        
        // Update lastMessageAt in conversation store is handled by sendMessage, 
        // but receiving a message should also update it?
        // Ideally yes, but store only has explicit update actions or create.
        // We can add `touchConversation` later if needed, but sent message usually defines "inactivity".
      });

      const unsubscribeTerminated = webSocketService.onTerminated((reason) => {
        console.log("[useChatOverlay] Message terminated:", reason);
        setStatusMessage(null);
        useMessageStore.getState().clearStreamingMessage(messageKey);
        Toast.show({
          type: "warning",
          text1: "Message Cut Off",
          text2: "Response was interrupted",
        });
      });

      const unsubscribeError = webSocketService.onError((error) => {
        console.error("[useChatOverlay] WebSocket error:", error);
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
        unsubscribeStatus,
      ];

      console.log(
        `[useChatOverlay] ✅ Registered ${unsubscribeRefs.current.length} fresh websocket handlers`
      );
    },
    [webSocketService]
  );

  // Register websocket handlers for receiving messages
  const registerHandlers = useCallback(
    async (messageKey: string) => {
      // ✅ Check for any active streams BEFORE clearing
      const messageStore = useMessageStore.getState();
      const activeStreams = Array.from(
        messageStore.streamingMessages.entries()
      ).filter(([_, msg]) => msg && !msg.isComplete);

      if (activeStreams.length > 0) {
        console.warn(
          "[useChatOverlay] ⚠️ Active streams detected, waiting for completion before clearing handlers:",
          activeStreams.map(([key]) => key)
        );

        // Wait for streams to complete
        await new Promise<void>((resolve) => {
          const checkInterval = setInterval(() => {
            const stillStreaming = Array.from(
              useMessageStore.getState().streamingMessages.entries()
            ).filter(([_, msg]) => msg && !msg.isComplete);

            if (stillStreaming.length === 0) {
              clearInterval(checkInterval);
              console.log(
                "[useChatOverlay] ✅ Streams completed, proceeding with handler registration"
              );
              resolve();
            }
          }, 100);

          // Timeout after 5 seconds
          setTimeout(() => {
            clearInterval(checkInterval);
            console.warn(
              "[useChatOverlay] ⏱️ Timeout waiting for streams, proceeding anyway"
            );
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
            `[useChatOverlay] Connection state changed: ${prevState} → ${newState}`
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
      console.log("[useChatOverlay] Disconnected state detected");
      isConnectedRef.current = false;
    }
  }, [connectionState]);

  // MANUAL connect method
  const connect = useCallback(async () => {
    if (isConnectedRef.current) {
      console.log("[useChatOverlay] Already connected, skipping");
      return;
    }

    try {
      console.log("[useChatOverlay] Connecting to chat");
      isConnectedRef.current = true;
      
      let currentActiveId = useConversationStore.getState().activeConversationId;
      
      // NEW FLOW: Create conversation on connect if none exists
      if (!currentActiveId) {
          console.log("[useChatOverlay] No active conversation. Initializing...");
          const { pendingGreeting, pendingInitialMessage, setPendingInitialMessage, setPendingGreeting, createConversationWithMessages } = useConversationStore.getState();
          
          const messagesToCreate: { content: string; sender: "user" | "assistant" }[] = [];
          
          // 1. Add Greeting (if available)
          if (pendingGreeting) {
              messagesToCreate.push({ content: pendingGreeting, sender: "assistant" });
          }
          
          // 2. Add Pending Initial Message (if available - e.g. Quick Reply)
          if (pendingInitialMessage) {
              messagesToCreate.push({ content: pendingInitialMessage, sender: "user" });
              // Clear it so we don't send it again
              setPendingInitialMessage(null);
          } else {
              // If no User message, check if we need a default greeting if none provided?
              // Assuming pendingGreeting is sufficient.
              if (messagesToCreate.length === 0) {
                  // Fallback if absolutely nothing
                  messagesToCreate.push({ content: "Hello! Ready to workout?", sender: "assistant" });
              }
          }
          
          if (messagesToCreate.length > 0) {
              console.log(`[useChatOverlay] Creating conversation with ${messagesToCreate.length} messages`);
              const result = await createConversationWithMessages(messagesToCreate);
              currentActiveId = result.conversationId;
              
              // Clear pending greeting after use
              setPendingGreeting(null);
          }
      }

      // If we still don't have an ID (shouldn't happen unless creation failed), bail?
      if (!currentActiveId) {
          console.error("[useChatOverlay] Failed to establish conversation ID");
          isConnectedRef.current = false;
          return;
      }

      // Register handlers for the conversation
      await registerHandlers(currentActiveId);

      // Connect with REAL conversation_id
      await webSocketService.ensureConnection({
        type: "coach",
        conversationId: currentActiveId,
      });

      // Handle pending message for existing conversation (Quick Reply flow)
      const { pendingInitialMessage, setPendingInitialMessage } = useConversationStore.getState();
      if (pendingInitialMessage) {
        console.log(`[useChatOverlay] Sending pending message for existing conversation: "${pendingInitialMessage}"`);
        // Clear immediately to prevent double-send
        setPendingInitialMessage(null);
        await sendMessage(pendingInitialMessage);
      }

    } catch (error) {
      console.error("[useChatOverlay] Failed to connect:", error);
      isConnectedRef.current = false;

      unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
      unsubscribeRefs.current = [];

      useMessageStore
        .getState()
        .setError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [registerHandlers, webSocketService]);

  const disconnect = useCallback(() => {
    console.log("[useChatOverlay] Disconnecting");

    console.log(
      `[useChatOverlay] Unsubscribing ${unsubscribeRefs.current.length} handlers`
    );
    unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
    unsubscribeRefs.current = [];
    isConnectedRef.current = false;

    setStatusMessage(null);

    webSocketService.setDisconnectReason("user_initiated");
    webSocketService.disconnect();
  }, [webSocketService]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
    };
  }, [disconnect]);

  const sendMessage = useCallback(
    async (content: string) => {
      try {
        let conversationId = useConversationStore.getState().activeConversationId;

        console.log(`🔍 [sendMessage] Content: "${content.substring(0, 30)}..."`);

        // Fallback: Create conversation if missing (should be handled by connect usually)
        if (!conversationId) {
            console.log("⚠️ [sendMessage] No active conversation found (unexpected). Creating new...");
            // Standard create with just one user message
            const { createConversationWithMessages } = useConversationStore.getState();
            const result = await createConversationWithMessages([{ content, sender: "user" }]);
            conversationId = result.conversationId;
            
            // Register handlers
            await registerHandlers(conversationId);
            // Ensure connection
             await webSocketService.ensureConnection({ 
                type: "coach",
                conversationId: conversationId 
             });
        }
        
        // Optimistic Update
        const userMessage: Message = {
          id: `temp-user-${Date.now()}`,
          conversation_id: conversationId,
          content,
          sender: "user",
          conversation_sequence: Date.now(), // simple sequencing
          timestamp: new Date(),
        };
        useMessageStore.getState().addMessage(conversationId, userMessage);
        
        // Touch conversation
        touchConversation(conversationId);

        // Prepare Payload
        // We only send the NEW message now. The history is managed by backend DB.
        // Wait, UnifiedCoachService expects "conversation_history" in payload?
        // Let's check... 
        // Logic in UnifiedCoachService:
        // `message_history = await self.conversation_context_service.load_context_admin(...)`
        // THEN it appends content from payload `conversation_history` if provided?
        // Actually, if we are persisting to DB, we might NOT need to send history in payload anymore?
        // But the current implementation of `UnifiedCoachService` might still rely on it if we didn't fully refactor it to IGNORE payload history.
        // Let's send it to be safe, or check backend code.
        // Based on my review of UnifiedCoachService, it LOADS from DB.
        
        const currentMessages = useMessageStore.getState().messages.get(conversationId) || [];
        
        const payload = {
          type: "message",
          message: content,
          // We can send history, but backend loads it. 
          // Sending it might double up if backend blindly appends.
          // Let's send it for now, assuming backend handles dedupe or uses it for context window if DB load fails.
          conversation_history: currentMessages, 
        };

        if (!webSocketService.isConnected()) {
             await webSocketService.ensureConnection({ 
                type: "coach",
                conversationId: conversationId 
             });
        }
        
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

        useMessageStore.getState().setError(errorMessage);
        throw errorMessage;
      }
    },
    [webSocketService, registerHandlers, touchConversation]
  );

  const processTemplateApproval = useCallback(
    (templateData: any) => {
      if (!userProfile?.user_id) {
         console.error("Cannot approve template: No user profile");
         return;
      }

      console.log("[useChatOverlay] Approving template:", templateData.name);
      
      const workout = convertTemplateToWorkout(templateData, userProfile.user_id.toString());
      
      if (workout) {
          const sessionStore = useUserSessionStore.getState();
          sessionStore.selectTemplate(workout);
          
          const currentWorkout = sessionStore.currentWorkout;
          if (currentWorkout) {
             sessionStore.startWorkout(currentWorkout);
          } else {
             const updatedState = useUserSessionStore.getState();
             if (updatedState.currentWorkout) {
                 updatedState.startWorkout(updatedState.currentWorkout);
             }
          }
      }
    },
    [userProfile?.user_id]
  );
  
  // Removed auto-send useEffect as it is now handled in connect()

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
    hasMessages: messages.length > 0,
    messageCount: messages.length,
    processTemplateApproval,
  };
}
