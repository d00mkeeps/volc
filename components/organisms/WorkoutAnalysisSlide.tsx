import React, { useCallback, useEffect, useState } from "react";
import { YStack } from "tamagui";
import { useMessaging } from "@/hooks/chat/useMessaging";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { ChatInterface } from "./ChatInterface";

interface WorkoutAnalysisSlideProps {
  onError?: (error: Error) => void;
}

let count = 0;

export const WorkoutAnalysisSlide = ({
  onError,
}: WorkoutAnalysisSlideProps) => {
  console.log(`=== analysis slide render count: ${count} ===`);
  count++;

  const [isInitialized, setIsInitialized] = useState(false);
  const [queuedMessages, setQueuedMessages] = useState<string[]>([]);
  const messaging = useMessaging();

  // Get conversationId from session store
  const conversationId = useUserSessionStore(
    (state) => state.activeConversationId
  );

  // Check if we're ready to send messages
  const isReadyToSend = conversationId && isInitialized;

  const handleSend = useCallback(
    async (content: string) => {
      try {
        if (isReadyToSend) {
          // Ready to send - process immediately
          await messaging.sendMessage(content);
        } else {
          // Not ready - add to queue
          console.log("[WorkoutAnalysisSlide] Queuing message:", content);
          setQueuedMessages((prev) => [...prev, content]);
        }
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    },
    [isReadyToSend, messaging.sendMessage, onError]
  );

  // Initialize conversation when conversationId becomes available
  useEffect(() => {
    if (conversationId && !isInitialized) {
      const initializeConversation = async () => {
        try {
          console.log(
            "[WorkoutAnalysisSlide] Initializing conversation:",
            conversationId
          );
          await messaging.loadMessages();
          setIsInitialized(true);
        } catch (error) {
          console.error("Failed to initialize conversation:", error);
          onError?.(error instanceof Error ? error : new Error(String(error)));
        }
      };

      initializeConversation();
    }
  }, [conversationId, isInitialized, messaging.loadMessages, onError]);

  // Process queued messages when ready
  useEffect(() => {
    if (isReadyToSend && queuedMessages.length > 0) {
      const processQueue = async () => {
        console.log(
          "[WorkoutAnalysisSlide] Processing",
          queuedMessages.length,
          "queued messages"
        );

        for (const message of queuedMessages) {
          try {
            await messaging.sendMessage(message);
          } catch (error) {
            console.error("Failed to send queued message:", error);
            onError?.(
              error instanceof Error ? error : new Error(String(error))
            );
            break; // Stop processing on error
          }
        }

        // Clear queue after successful processing
        setQueuedMessages([]);
      };

      processQueue();
    }
  }, [isReadyToSend, queuedMessages, messaging.sendMessage, onError]);

  // Reset initialization when conversationId changes
  useEffect(() => {
    setIsInitialized(false);
  }, [conversationId]);

  // Handle messaging errors
  useEffect(() => {
    if (messaging.error) {
      onError?.(messaging.error);
    }
  }, [messaging.error, onError]);

  // Simple connection state logic
  const getConnectionState = () => {
    // If no messages yet, we're expecting the first AI message
    if (messaging.messages.length === 0) return "expecting_ai_message";
    return "ready";
  };

  const connectionState = getConnectionState();

  // Always render ChatInterface immediately
  return (
    <YStack flex={1}>
      <ChatInterface
        messages={messaging.messages}
        streamingMessage={messaging.streamingMessage}
        onSend={handleSend}
        placeholder="Ask about your workout analysis..."
        connectionState={connectionState}
        queuedMessageCount={queuedMessages.length}
      />
    </YStack>
  );
};
