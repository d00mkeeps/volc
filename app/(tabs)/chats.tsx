import React, { useState } from "react";
import { Stack } from "tamagui";
import ConversationList from "@/components/molecules/chat/ConversationList";

export default function ChatScreen() {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);

  // The ExistingConversationChat component has been removed as the conversation
  // page is no longer in use. The onSelectConversation prop of ConversationList
  // now simply sets the selectedConversationId state.

  return (
    <Stack flex={1} backgroundColor="$background" padding="$4">
      <ConversationList onSelectConversation={setSelectedConversationId} />
    </Stack>
  );
}
