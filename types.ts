export type RootStackParamList = {
    ConversationList: undefined;
    Conversation: { conversationId: string };
    // Add other screens here as needed
  };
  export type ConversationListProps = {
    onConversationPress: (id: string) => void;
  }