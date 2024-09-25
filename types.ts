export type RootStackParamList = {
    ConversationList: undefined;
    Conversation: { conversationId: string };
    // Add other screens here as needed
  };
  export type ConversationListProps = {
    onConversationPress: (id: string) => void;
  }

  export interface ConversationUIProps {
    title: string;
    subtitle: string;
    messages: any[]; // Replace 'any' with your message type
    draftMessage?: string;
    onSendMessage: (message: string) => void;
    onDraftMessageChange?: (draft: string) => void;
  }