import React, { useCallback, useEffect } from "react";
import { YStack } from "tamagui";
import { useMessaging } from "@/hooks/chat/useMessaging";
import { ChatInterface } from "./ChatInterface";

interface WorkoutAnalysisSlideProps {
  conversationId: string;
  onError?: (error: Error) => void;
}

export const WorkoutAnalysisSlide = ({
  conversationId,
  onError,
}: WorkoutAnalysisSlideProps) => {
  const messaging = useMessaging(conversationId);

  const handleSend = useCallback(
    async (content: string) => {
      try {
        await messaging.sendMessage(content);
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    },
    [messaging, onError]
  );

  // Load messages when conversation is created
  useEffect(() => {
    if (conversationId) {
      messaging.loadMessages();
    }
  }, [conversationId]);

  // Handle messaging errors
  useEffect(() => {
    if (messaging.error) {
      onError?.(messaging.error);
    }
  }, [messaging.error, onError]);

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
