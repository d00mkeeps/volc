import React, { useState, useCallback, useEffect } from "react";
import { YStack, Text } from "tamagui";
import { useConversationStore } from "@/stores/chat/ConversationStore";
import { useMessaging } from "@/hooks/chat/useMessaging";
import { ChatInterface } from "./ChatInterface";
import { InputArea } from "../atoms/InputArea";
import { useUserSessionStore } from "@/stores/userSessionStore";

interface WorkoutAnalysisSlideProps {
  onError?: (error: Error) => void;
}

export const WorkoutAnalysisSlide = ({
  onError,
}: WorkoutAnalysisSlideProps) => {
  const [conversationId, setConversationId] = useState<string>("");
  const [hasAutoSent, setHasAutoSent] = useState(false);

  const { currentWorkout } = useUserSessionStore();
  const conversationStore = useConversationStore();
  const messaging = useMessaging(conversationId);

  const handleSend = useCallback(
    async (content: string) => {
      try {
        if (!conversationId) {
          // Create new conversation
          const workoutName = currentWorkout?.name || "Workout";
          const title = `${workoutName} analysis`;

          const newConversationId = await conversationStore.createConversation({
            title,
            firstMessage: content,
            configName: "workout-analysis",
          });

          setConversationId(newConversationId);
        } else {
          // MessageStore automatically gathers analysis data and sends
          await messaging.sendMessage(content);
        }
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    },
    [conversationId, currentWorkout, conversationStore, messaging, onError]
  );

  // Auto-send initial analysis request
  useEffect(() => {
    if (!conversationId && !hasAutoSent) {
      setHasAutoSent(true);
      handleSend("Analyze my workout");
    }
  }, [conversationId, hasAutoSent, handleSend]);

  // Load messages when conversation is created
  useEffect(() => {
    if (conversationId) {
      messaging.loadMessages();
    }
  }, [conversationId, messaging]);

  // Handle messaging errors
  useEffect(() => {
    if (messaging.error) {
      onError?.(messaging.error);
    }
  }, [messaging.error, onError]);

  return (
    <YStack flex={1}>
      {!conversationId ? (
        <>
          <YStack flex={1} justifyContent="center" alignItems="center">
            <Text color="$textMuted" fontSize="$4">
              Ready to analyze your workout
            </Text>
          </YStack>
          <InputArea
            placeholder="Ask about your workout analysis..."
            onSendMessage={handleSend}
          />
        </>
      ) : (
        <ChatInterface
          messages={messaging.messages}
          streamingMessage={messaging.streamingMessage}
          onSend={handleSend}
          placeholder="Ask about your workout analysis..."
        />
      )}
    </YStack>
  );
};
