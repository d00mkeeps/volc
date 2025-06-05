import React, { useState, useEffect, useCallback } from "react";
import { YStack, Text } from "tamagui";
import { useConversationStore } from "@/stores/chat/ConversationStore";
import { useMessaging } from "@/hooks/chat/useMessaging";
import { MessageList } from "../molecules/MessageList";
import { InputArea } from "../atoms/InputArea";

interface WorkoutAnalysisChatProps {
  analysisBundle?: any;
  analysisLoading: boolean;
  onError: (error: Error) => void;
}

export const WorkoutAnalysisChat = ({
  analysisBundle,
  analysisLoading,
  onError,
}: WorkoutAnalysisChatProps) => {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [hasInitialBundle, setHasInitialBundle] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const conversationStore = useConversationStore();

  // Only use messaging if we have a conversation
  const messaging = conversationId ? useMessaging(conversationId) : null;

  // Create conversation on mount
  useEffect(() => {
    async function createConversation() {
      if (isCreatingConversation || conversationId) return;

      setIsCreatingConversation(true);

      try {
        console.log("[WorkoutAnalysisChat] Creating new conversation...");

        const newConversationId = await conversationStore.createConversation({
          title: "Workout Analysis",
          firstMessage: "Analyze my workout data",
          configName: "workout-analysis",
        });

        console.log(
          "[WorkoutAnalysisChat] Created conversation:",
          newConversationId
        );
        setConversationId(newConversationId);
      } catch (error) {
        console.error(
          "[WorkoutAnalysisChat] Error creating conversation:",
          error
        );
        onError(error instanceof Error ? error : new Error(String(error)));
      } finally {
        setIsCreatingConversation(false);
      }
    }

    createConversation();
  }, [conversationStore, onError, isCreatingConversation, conversationId]);

  // Handle messaging errors
  useEffect(() => {
    if (messaging?.error) {
      console.error("[WorkoutAnalysisChat] Messaging error:", messaging.error);
      onError(messaging.error);
    }
  }, [messaging?.error, onError]);

  // Send message with bundle on first message
  // Send message with bundle on first message
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!messaging?.sendMessage) {
        console.warn(
          "[WorkoutAnalysisChat] Cannot send message: messaging not ready"
        );
        return;
      }

      try {
        console.log(
          "[WorkoutAnalysisChat] Sending message:",
          content.substring(0, 50) + "..."
        );

        if (!hasInitialBundle && analysisBundle) {
          // Send first message with analysis bundle
          console.log("[WorkoutAnalysisChat] Sending with analysis bundle");
          await messaging.sendMessage(content, analysisBundle); // Pass bundle as second param
          setHasInitialBundle(true);
        } else {
          // Send regular message without bundle
          console.log("[WorkoutAnalysisChat] Sending regular message");
          await messaging.sendMessage(content, undefined); // No bundle
        }
      } catch (error) {
        console.error("[WorkoutAnalysisChat] Error sending message:", error);
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    },
    [messaging, analysisBundle, hasInitialBundle, onError]
  );
  // Input is disabled if analysis loading or no bundle ready
  const inputDisabled =
    analysisLoading || !analysisBundle || !messaging?.isConnected;

  // Determine what to show
  if (isCreatingConversation || !conversationId) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" gap="$2">
        <Text color="$textMuted" fontSize="$4">
          Setting up workout analysis...
        </Text>
      </YStack>
    );
  }

  if (!messaging) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" gap="$2">
        <Text color="$textMuted" fontSize="$4">
          Initializing chat...
        </Text>
      </YStack>
    );
  }

  if (messaging.isConnecting) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" gap="$2">
        <Text color="$textMuted" fontSize="$4">
          Connecting to analysis service...
        </Text>
      </YStack>
    );
  }

  if (analysisLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" gap="$2">
        <Text color="$textMuted" fontSize="$4">
          Analyzing your workout...
        </Text>
        <Text color="$textSoft" fontSize="$3" textAlign="center">
          This may take a few moments
        </Text>
      </YStack>
    );
  }

  if (!analysisBundle) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" gap="$2">
        <Text color="$textMuted" fontSize="$4">
          Waiting for workout analysis...
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
        disabled={inputDisabled}
        placeholder={
          analysisLoading
            ? "Analyzing workout..."
            : !analysisBundle
            ? "Preparing analysis..."
            : !messaging.isConnected
            ? "Connecting..."
            : "Ask about your workout..."
        }
        onSendMessage={handleSendMessage}
      />
    </YStack>
  );
};
