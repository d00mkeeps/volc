import React, { useState } from "react";
import { Stack } from "tamagui";
import ConversationList from "@/components/molecules/chat/ConversationList";
import { ExistingConversationChat } from "@/components/organisms/ExistingConversationChat";

export default function ChatScreen() {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);

  if (selectedConversationId) {
    return (
      <ExistingConversationChat
        conversationId={selectedConversationId}
        onBack={() => setSelectedConversationId(null)}
      />
    );
  }

  return (
    <Stack flex={1} backgroundColor="$background" padding="$4">
      <ConversationList onSelectConversation={setSelectedConversationId} />
    </Stack>
  );
}
