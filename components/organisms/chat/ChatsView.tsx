import React, { useEffect, useState } from "react";
import { Stack, YStack } from "tamagui";
import { RefreshControl, ScrollView } from "react-native";
import ConversationList from "@/components/molecules/chat/ConversationList";
import { useConversationStore } from "@/stores/chat/ConversationStore";
// import { useLocalSearchParams } from "expo-router"; // Removing Router logic from View
import Text from "@/components/atoms/core/Text";

interface ChatsViewProps {
  isActive?: boolean;
  onClose?: () => void;
}

export default function ChatsView({ isActive = true, onClose }: ChatsViewProps) {
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { getConversations, resumeConversation, setPendingChatOpen } = useConversationStore();

  const onSelectConversation = (id: string) => {
      // 1. Resume the conversation (updates store state, sets active)
      resumeConversation(id);
      
      // 2. Signal ChatOverlay to open
      setPendingChatOpen(true);
      
      // 3. Close this modal
      if (onClose) onClose();
  };

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

        <ConversationList 
          onSelectConversation={onSelectConversation} 
          limit={100} 
        />
      </ScrollView>
    </Stack>
  );
}
