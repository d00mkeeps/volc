// components/chat/organisms/WorkoutAnalysisChat.tsx
import React, { useState, useCallback } from "react";
import { YStack, Text } from "tamagui";
import { useWorkoutAnalysisStore } from "@/stores/analysis/WorkoutAnalysisStore";
import { useConversationStore } from "@/stores/chat/ConversationStore";
import { useMessaging } from "@/hooks/chat/useMessaging";
import { MessageList } from "../molecules/MessageList";
import { InputArea } from "../atoms/InputArea";

interface WorkoutAnalysisChatProps {
  onError?: (error: Error) => void;
}

export const WorkoutAnalysisChat = React.memo(
  ({ onError }: WorkoutAnalysisChatProps) => {
    const [conversationId, setConversationId] = useState<string>("");

    const conversationStore = useConversationStore();
    const { getResult } = useWorkoutAnalysisStore();
    const messaging = useMessaging(conversationId);

    const handleSendMessage = useCallback(
      async (content: string) => {
        try {
          // First message - create conversation and send with bundle
          if (!conversationId) {
            console.log(
              "[WorkoutAnalysisChat] Creating conversation for first message"
            );

            // Create conversation
            const newConversationId =
              await conversationStore.createConversation({
                title: "Workout Analysis",
                firstMessage: content,
                configName: "workout-analysis",
              });

            setConversationId(newConversationId);

            // Get analysis bundle from store
            const analysisBundle = getResult();

            // Send message with bundle (useMessaging will handle connection)
            if (analysisBundle) {
              // Wait a moment for useMessaging to connect
              setTimeout(() => {
                messaging?.sendMessage(content, { analysisBundle });
              }, 1000);
            }
          } else {
            // Subsequent messages - send normally
            await messaging?.sendMessage(content);
          }
        } catch (error) {
          console.error("[WorkoutAnalysisChat] Error sending message:", error);
          onError?.(error instanceof Error ? error : new Error(String(error)));
        }
      },
      [conversationId, conversationStore, getResult, messaging, onError]
    );

    // Handle messaging errors
    React.useEffect(() => {
      if (messaging?.error) {
        onError?.(messaging.error);
      }
    }, [messaging?.error, onError]);

    if (!conversationId) {
      return (
        <YStack flex={1}>
          <YStack flex={1} justifyContent="center" alignItems="center">
            <Text color="$textMuted" fontSize="$4">
              Ready to analyze your workout
            </Text>
          </YStack>

          <InputArea
            placeholder="Ask about your workout analysis..."
            onSendMessage={handleSendMessage}
          />
        </YStack>
      );
    }

    if (!messaging?.isConnected) {
      return (
        <YStack flex={1} justifyContent="center" alignItems="center">
          <Text color="$textMuted" fontSize="$4">
            Connecting to conversation...
          </Text>
        </YStack>
      );
    }

    return (
      <YStack flex={1}>
        <MessageList
          messages={messaging.messages || []}
          streamingMessage={messaging.streamingMessage}
        />

        <InputArea
          disabled={!messaging.isConnected}
          placeholder="Ask about your workout analysis..."
          onSendMessage={handleSendMessage}
        />
      </YStack>
    );
  }
);

WorkoutAnalysisChat.displayName = "WorkoutAnalysisChat";
