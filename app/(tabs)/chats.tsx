import React, { useEffect, useState } from "react";
import { Stack } from "tamagui";
import { RefreshControl, ScrollView } from "react-native";
import ConversationList from "@/components/molecules/chat/ConversationList";
import { ExistingConversationChat } from "@/components/organisms/ExistingConversationChat";
import { useConversationStore } from "@/stores/chat/ConversationStore";
import { useLocalSearchParams } from "expo-router"; // Add this import

export default function ChatScreen() {
  const { conversationId: paramConversationId } = useLocalSearchParams<{
    conversationId?: string;
  }>();
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { getConversations } = useConversationStore();
  useEffect(() => {
    if (paramConversationId && paramConversationId !== selectedConversationId) {
      console.log(
        "📍 Setting conversation from route params:",
        paramConversationId
      );
      setSelectedConversationId(paramConversationId);
    }
  }, [paramConversationId]);
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
        <ConversationList onSelectConversation={setSelectedConversationId} />
      </ScrollView>
    </Stack>
  );
}
