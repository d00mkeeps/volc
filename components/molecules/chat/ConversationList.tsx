import React, { useEffect } from "react";
import { Stack, ScrollView } from "tamagui";
import Text from "@/components/atoms/core/Text";
import ContentCard from "@/components/atoms/core/ContentCard";
import { useConversationStore } from "@/stores/chat/ConversationStore";

interface ConversationListProps {
  limit?: number;
  onSelectConversation: (conversationId: string) => void;
}

export default function ConversationList({
  limit = 3,
  onSelectConversation,
}: ConversationListProps) {
  const { conversations, isLoading, getConversations, deleteConversation } =
    useConversationStore();

  const allConversations = Array.from(conversations.values())
    .filter((conversation) => conversation.message_count > 0) // Add this line
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const displayedConversations = allConversations.slice(0, limit);

  const handleConversationPress = (conversationId: string) => {
    onSelectConversation(conversationId);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await deleteConversation(conversationId);
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  if (isLoading && allConversations.length === 0) {
    return (
      <Stack flex={1}>
        <Text>Loading conversations...</Text>
      </Stack>
    );
  }

  // Add this new empty state check
  if (allConversations.length === 0) {
    return (
      <Stack flex={1}>
        <Text size="medium" fontWeight="500" color="$text" marginBottom="$2">
          Recent Conversations
        </Text>
        <Stack padding="$4" alignItems="center">
          <Text size="medium" color="$textSoft" textAlign="center">
            No conversations yet. Start chatting to see your history here!
          </Text>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack flex={1}>
      <Text size="large" fontWeight="600" color="$text" marginBottom="$2">
        Recent Chats
      </Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Stack gap="$2">
          {displayedConversations.map((conversation) => (
            <ContentCard
              key={conversation.id}
              title={conversation.title}
              subtitle={`${conversation.message_count} messages`}
              date={new Date(conversation.created_at)}
              onPress={() => handleConversationPress(conversation.id)}
              showDelete={true}
              onDelete={() => handleDeleteConversation(conversation.id)}
            />
          ))}
        </Stack>
      </ScrollView>
    </Stack>
  );
}
