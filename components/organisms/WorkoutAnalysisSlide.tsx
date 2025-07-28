import React, { useCallback, useEffect, useState } from "react";
import { YStack, Text } from "tamagui";
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
  const messaging = useMessaging(); // No conversationId param!

  // Get conversationId from session store
  const conversationId = useUserSessionStore(
    (state) => state.activeConversationId
  );

  const handleSend = useCallback(
    async (content: string) => {
      try {
        await messaging.sendMessage(content);
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    },
    [messaging.sendMessage, onError]
  );

  // Initialize conversation and load messages
  useEffect(() => {
    if (conversationId && !isInitialized) {
      const initializeConversation = async () => {
        try {
          console.log(
            `[WorkoutAnalysisSlide] Initializing conversation: ${conversationId}`
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
  }, [conversationId, isInitialized]); // Removed messaging.loadMessages and onError

  // Handle messaging errors separately
  useEffect(() => {
    if (messaging.error) {
      onError?.(messaging.error);
    }
  }, [messaging.error]); // Keep this separate

  // Reset initialization when conversationId changes
  useEffect(() => {
    setIsInitialized(false);
  }, [conversationId]);

  if (!conversationId) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Text>No active conversation found</Text>
      </YStack>
    );
  }

  if (!isInitialized) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Text>Loading conversation...</Text>
      </YStack>
    );
  }

  return (
    <YStack flex={1}>
      <ChatInterface
        messages={messaging.messages}
        streamingMessage={messaging.streamingMessage}
        onSend={handleSend}
        placeholder="Ask about your workout analysis..."
      />
    </YStack>
  );
};
