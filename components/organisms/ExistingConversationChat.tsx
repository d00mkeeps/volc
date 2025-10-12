import React, { useEffect, useCallback, useState } from "react";
import { YStack, XStack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import Button from "@/components/atoms/core/Button";
import { ArrowLeft } from "@/assets/icons/IconMap";
import { ChatInterface } from "./ChatInterface";
import { useMessaging } from "@/hooks/chat/useMessaging";
import { useUserSessionStore } from "@/stores/userSessionStore";

interface ExistingConversationChatProps {
  conversationId: string;
  onBack: () => void;
  conversationTitle?: string; // ADD THIS
  initialMessage?: string | null;
  onMessageSent?: () => void;
}

export const ExistingConversationChat = ({
  conversationId,
  onBack,
  conversationTitle,
  initialMessage,
  onMessageSent,
}: ExistingConversationChatProps) => {
  const messaging = useMessaging();
  const setActiveConversation = useUserSessionStore(
    (state) => state.setActiveConversation
  );
  const [hasAutoSent, setHasAutoSent] = useState(false);

  // Debug: Log when component mounts with initialMessage
  useEffect(() => {
    if (initialMessage) {
      console.log(
        "🔵 ExistingConversationChat mounted with initialMessage:",
        initialMessage
      );
    }
  }, []);

  useEffect(() => {
    setActiveConversation(conversationId);
    return () => {
      setActiveConversation(null);
    };
  }, [conversationId, setActiveConversation]);

  // Load messages when conversation becomes active
  useEffect(() => {
    if (messaging.conversationId === conversationId) {
      messaging.loadMessages().catch(console.error);
    }
  }, [messaging.conversationId, conversationId]);

  // Auto-send initial message once ready
  useEffect(() => {
    console.log("🔍 Auto-send effect check:", {
      hasInitialMessage: !!initialMessage,
      hasAutoSent,
      messagingConversationId: messaging.conversationId,
      conversationId,
      isLoading: messaging.isLoading,
      isStreaming: messaging.isStreaming,
      messageCount: messaging.messageCount,
    });

    if (
      initialMessage &&
      !hasAutoSent &&
      messaging.conversationId === conversationId &&
      !messaging.isLoading &&
      !messaging.isStreaming
    ) {
      console.log(
        "🚀 Attempting to auto-send initial message:",
        initialMessage
      );

      // Add a small delay to ensure websocket is fully ready
      const timer = setTimeout(() => {
        handleSend(initialMessage)
          .then(() => {
            console.log("✅ Initial message sent successfully");
            setHasAutoSent(true);
            onMessageSent?.();
          })
          .catch((error) => {
            console.error("❌ Failed to auto-send initial message:", error);
          });
      }, 500); // 500ms delay

      return () => clearTimeout(timer);
    }
  }, [
    initialMessage,
    hasAutoSent,
    messaging.conversationId,
    conversationId,
    messaging.isLoading,
    messaging.isStreaming,
    messaging.messageCount,
  ]);

  const handleSend = useCallback(
    async (content: string) => {
      try {
        await messaging.sendMessage(content);
      } catch (error) {
        console.error("Send failed:", error);
        throw error;
      }
    },
    [messaging.sendMessage]
  );

  const handleBack = useCallback(() => {
    setActiveConversation(null);
    onBack();
  }, [onBack, setActiveConversation]);

  // Error state
  if (messaging.error) {
    return (
      <YStack flex={1} padding="$4" gap="$4">
        <XStack alignItems="center" gap="$2">
          <Button size="$3" chromeless onPress={handleBack}>
            <ArrowLeft size={18} />
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

  // Loading state
  if (messaging.conversationId !== conversationId || messaging.isLoading) {
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
        backgroundColor="$background" // ADD THIS
      >
        <Button
          size="$3"
          chromeless
          backgroundColor="transparent" // ADD THIS
          onPress={handleBack}
        >
          <ArrowLeft size={18} color="#f84f3e" /> {/* ADD color prop */}
        </Button>
        <Text size="large" fontWeight="600">
          {conversationTitle || "Workout Analysis"}
        </Text>
      </XStack>
      <YStack flex={1} backgroundColor="$background">
        <ChatInterface
          messages={messaging.messages}
          streamingMessage={messaging.streamingMessage}
          onSend={handleSend}
        />
      </YStack>
    </YStack>
  );
};
