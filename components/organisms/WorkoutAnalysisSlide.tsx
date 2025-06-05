// components/chat/organisms/WorkoutAnalysisSlide.tsx
import React, { useState, useCallback, useEffect } from "react";
import { YStack } from "tamagui";
import { useWorkoutAnalysisStore } from "@/stores/analysis/WorkoutAnalysisStore";
import { useConversationStore } from "@/stores/chat/ConversationStore";
import { useMessaging } from "@/hooks/chat/useMessaging";
import { ChatInterface } from "./ChatInterface";

interface WorkoutAnalysisSlideProps {
  onError?: (error: Error) => void;
}

export const WorkoutAnalysisSlide = ({
  onError,
}: WorkoutAnalysisSlideProps) => {
  const [conversationId, setConversationId] = useState<string>("");
  const [pendingMessage, setPendingMessage] = useState<{
    content: string;
    analysisBundle: any;
  } | null>(null);

  const conversationStore = useConversationStore();
  const { getResult } = useWorkoutAnalysisStore();
  const messaging = useMessaging(conversationId);

  const handleSend = useCallback(
    async (content: string) => {
      try {
        if (!conversationId) {
          console.log(
            "[WorkoutAnalysisSlide] Creating conversation for first message"
          );

          const newConversationId = await conversationStore.createConversation({
            title: "Workout Analysis",
            firstMessage: content,
            configName: "workout-analysis",
          });

          setConversationId(newConversationId);

          const analysisBundle = getResult();
          if (analysisBundle) {
            setPendingMessage({ content, analysisBundle });
          }
        } else {
          await messaging?.sendMessage(content);
        }
      } catch (error) {
        console.error("[WorkoutAnalysisSlide] Error sending message:", error);
        onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    },
    [conversationId, conversationStore, getResult, messaging, onError]
  );

  // Handle pending message when connection is ready
  useEffect(() => {
    if (messaging?.isConnected && pendingMessage) {
      messaging.sendMessage(pendingMessage.content, {
        analysisBundle: pendingMessage.analysisBundle,
      });
      setPendingMessage(null);
    }
  }, [messaging?.isConnected, pendingMessage, messaging]);

  // Handle messaging errors
  useEffect(() => {
    if (messaging?.error) {
      onError?.(messaging.error);
    }
  }, [messaging?.error, onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (conversationId) {
        setConversationId("");
        setPendingMessage(null);
      }
    };
  }, [conversationId]);

  return (
    <YStack flex={1}>
      <ChatInterface
        messages={messaging?.messages || []}
        streamingMessage={messaging?.streamingMessage}
        isConnected={messaging?.isConnected}
        onSend={handleSend}
        placeholder="Ask about your workout analysis..."
      />
    </YStack>
  );
};

WorkoutAnalysisSlide.displayName = "WorkoutAnalysisSlide";
