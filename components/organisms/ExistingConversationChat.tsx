// components/chat/organisms/ExistingConversationChat.tsx
import React, { useState, useEffect, useCallback } from "react";
import { YStack, XStack, Button, Text } from "tamagui";
import { ArrowLeft } from "@tamagui/lucide-icons";
import { ChatInterface } from "./ChatInterface";
import { useMessageStore } from "@/stores/chat/MessageStore";
import { useGraphBundleStore } from "@/stores/attachments/GraphBundleStore";
import { useConversationStore } from "@/stores/chat/ConversationStore";
import { useMessaging } from "@/hooks/chat/useMessaging";

interface ExistingConversationChatProps {
  conversationId: string;
  onBack: () => void;
}

export const ExistingConversationChat = ({
  conversationId,
  onBack,
}: ExistingConversationChatProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const messageStore = useMessageStore();
  const bundleStore = useGraphBundleStore();
  const conversationStore = useConversationStore();
  const messaging = useMessaging(conversationId);

  const messages = messageStore.getMessages(conversationId);
  const bundles = bundleStore.getBundlesByConversation(conversationId);
  const latestBundle = bundles[0];

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load messages, bundles, and connect
        await Promise.all([
          messageStore.loadMessages(conversationId),
          bundleStore.loadBundlesForConversation(conversationId),
          conversationStore.getConversation(conversationId),
        ]);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [conversationId]);

  const handleSend = useCallback(
    async (content: string) => {
      try {
        await messaging?.sendMessage(content, {
          analysisBundle: latestBundle,
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [messaging, latestBundle]
  );

  if (isLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Text>Loading conversation...</Text>
      </YStack>
    );
  }

  if (error) {
    return (
      <YStack flex={1} padding="$4" gap="$4">
        <XStack alignItems="center" gap="$2">
          <Button size="$3" chromeless onPress={onBack}>
            <ArrowLeft size="$1" />
          </Button>
          <Text>Error</Text>
        </XStack>
        <Text color="$red10">Failed to load conversation: {error.message}</Text>
        <Button onPress={onBack}>Back to conversations</Button>
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
        <Button size="$3" chromeless onPress={onBack}>
          <ArrowLeft size="$1" />
        </Button>
        <Text fontSize="$5" fontWeight="600">
          Workout Analysis
        </Text>
      </XStack>

      <ChatInterface
        messages={messages}
        streamingMessage={messaging?.streamingMessage}
        isConnected={messaging?.isConnected}
        onSend={handleSend}
        placeholder="Continue the conversation..."
      />
    </YStack>
  );
};
