import React, { useEffect, useCallback } from "react";
import { YStack, XStack, Button, Text } from "tamagui";
import { ArrowLeft } from "@tamagui/lucide-icons";
import { ChatInterface } from "./ChatInterface";
import { useMessaging } from "@/hooks/chat/useMessaging";
import { useUserSessionStore } from "@/stores/userSessionStore";

interface ExistingConversationChatProps {
  conversationId: string;
  onBack: () => void;
}

export const ExistingConversationChat = ({
  conversationId,
  onBack,
}: ExistingConversationChatProps) => {
  const messaging = useMessaging();
  const setActiveConversation = useUserSessionStore(
    (state) => state.setActiveConversation
  );

  useEffect(() => {
    setActiveConversation(conversationId);
    return () => {
      setActiveConversation(null);
    };
  }, [conversationId, setActiveConversation]);

  useEffect(() => {
    if (messaging.conversationId === conversationId) {
      messaging.loadMessages().catch(console.error);
    }
  }, [messaging.conversationId, conversationId]);

  const handleSend = useCallback(
    async (content: string) => {
      try {
        await messaging.sendMessage(content);
      } catch (error) {
        console.error("Send failed:", error);
      }
    },
    [messaging.sendMessage]
  );

  const handleBack = useCallback(() => {
    setActiveConversation(null);
    onBack();
  }, [onBack, setActiveConversation]);

  if (messaging.error) {
    return (
      <YStack flex={1} padding="$4" gap="$4">
        <XStack alignItems="center" gap="$2">
          <Button size="$3" chromeless onPress={handleBack}>
            <ArrowLeft size="$1" />
          </Button>
          <Text>Error</Text>
        </XStack>
        <Text color="$red10">
          Failed to load conversation: {messaging.error.message}
        </Text>
        <Button onPress={handleBack}>Back to conversations</Button>
      </YStack>
    );
  }

  if (messaging.conversationId !== conversationId) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Text>Loading conversation...</Text>
      </YStack>
    );
  }

  return (
    <YStack flex={1}>
      <XStack
        padding="$3"
        alignItems="center"
        gap="$2"
        borderBottomWidth={1}
        borderBottomColor="$borderSoft"
      >
        <Button size="$3" chromeless onPress={handleBack}>
          <ArrowLeft size="$1" />
        </Button>
        <Text fontSize="$5" fontWeight="600">
          Workout Analysis
        </Text>
      </XStack>

      <YStack flex={1} backgroundColor="$background">
        <ChatInterface
          messages={messaging.messages}
          streamingMessage={messaging.streamingMessage}
          onSend={handleSend}
          placeholder="Continue the conversation..."
        />
      </YStack>
    </YStack>
  );
};
