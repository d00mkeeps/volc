import React, { useEffect, useState } from "react";
import { Stack, YStack } from "tamagui";
import { RefreshControl, ScrollView } from "react-native";
import ConversationList from "@/components/molecules/chat/ConversationList";
import { ExistingConversationChat } from "@/components/organisms/chat/ExistingConversationChat";
import { useConversationStore } from "@/stores/chat/ConversationStore";
import { useLocalSearchParams } from "expo-router";
import Text from "@/components/atoms/core/Text";

interface ChatScreenProps {
  isActive?: boolean;
}

export default function ChatScreen({ isActive = true }: ChatScreenProps) {
  const { conversationId: paramConversationId } = useLocalSearchParams<{
    conversationId?: string;
  }>();
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { getConversations } = useConversationStore();

  const selectedConversation = useConversationStore((state) =>
    selectedConversationId
      ? state.conversations.get(selectedConversationId)
      : null
  );
  const pendingMessage = useConversationStore(
    (state) => state.pendingInitialMessage
  );
  const clearPendingMessage = useConversationStore(
    (state) => state.setPendingInitialMessage
  );

  useEffect(() => {
    if (paramConversationId && paramConversationId !== selectedConversationId) {
      console.log(
        "📍 Setting conversation from route params:",
        paramConversationId
      );
      setSelectedConversationId(paramConversationId);
      if (pendingMessage) {
        console.log("💬 Found pending message in store:", pendingMessage);
      }
    }
  }, [paramConversationId, pendingMessage]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await getConversations();
    } catch (error) {
      console.error("Failed to refresh conversations:", error);
    } finally {
      setRefreshing(false);
    }
  };

  if (selectedConversationId) {
    return (
      <ExistingConversationChat
        conversationId={selectedConversationId}
        onBack={() => setSelectedConversationId(null)}
        initialMessage={pendingMessage}
        conversationTitle={selectedConversation?.title}
        isActive={isActive}
        onMessageSent={() => clearPendingMessage(null)}
      />
    );
  }

  return (
    <Stack flex={1} backgroundColor="$background">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <YStack gap="$1" marginBottom="$4">
          <Text size="xl" variant="heading">
            Chats
          </Text>
          <Text size="medium" color="$textMuted">
            All your chats, in one place
          </Text>
        </YStack>

        <ConversationList onSelectConversation={setSelectedConversationId} />
      </ScrollView>
    </Stack>
  );
}
