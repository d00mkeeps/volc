import React, { useState, useCallback, useEffect } from "react";
import { YStack, Text } from "tamagui";
import { useWorkoutAnalysisStore } from "@/stores/analysis/WorkoutAnalysisStore";
import { useConversationStore } from "@/stores/chat/ConversationStore";
import { useMessaging } from "@/hooks/chat/useMessaging";
import { ChatInterface } from "./ChatInterface";
import { useGraphBundleStore } from "@/stores/attachments/GraphBundleStore";
import { InputArea } from "../atoms/InputArea";
import { useUserSessionStore } from "@/stores/userSessionStore";

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
  const [hasAutoSent, setHasAutoSent] = useState(false);

  const { currentWorkout } = useUserSessionStore();
  const conversationStore = useConversationStore();
  const { getResult } = useWorkoutAnalysisStore();
  const bundleStore = useGraphBundleStore();
  const messaging = useMessaging(conversationId);

  const handleSend = useCallback(
    async (content: string) => {
      try {
        if (!conversationId) {
          const workoutName = currentWorkout?.name || "Workout";
          const title = `${workoutName} analysis`;

          const newConversationId = await conversationStore.createConversation({
            title,
            firstMessage: content,
            configName: "workout-analysis",
          });

          setConversationId(newConversationId);

          const analysisBundle = getResult();
          if (analysisBundle) {
            await bundleStore.addBundle(analysisBundle, newConversationId);
            setPendingMessage({ content, analysisBundle });
          }
        } else {
          await messaging?.sendMessage(content);
        }
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    },
    [
      conversationId,
      currentWorkout,
      conversationStore,
      getResult,
      messaging,
      onError,
      bundleStore,
    ]
  );

  useEffect(() => {
    if (!conversationId && !hasAutoSent) {
      setHasAutoSent(true);
      handleSend("Analyze my workout");
    }
  }, [conversationId, hasAutoSent, handleSend]);

  useEffect(() => {
    if (messaging?.isConnected && pendingMessage) {
      messaging.sendMessage(pendingMessage.content, {
        analysisBundle: pendingMessage.analysisBundle,
      });
      setPendingMessage(null);
    }
  }, [messaging?.isConnected, pendingMessage, messaging]);

  useEffect(() => {
    if (messaging?.error) {
      onError?.(messaging.error);
    }
  }, [messaging?.error, onError]);

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
          messages={messaging?.messages || []}
          streamingMessage={messaging?.streamingMessage}
          isConnected={messaging?.isConnected}
          onSend={handleSend}
          placeholder="Ask about your workout analysis..."
        />
      )}
    </YStack>
  );
};
