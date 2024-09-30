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



export interface Program {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface ProgramCardProps {
  program: Program;
  onPress?: (programId: string) => void;
}

export interface ProgramListProps {
  programs: Program[];
  onProgramPress?: (programId: string) => void;
}

export interface ProgramsScreenProps {
  navigation: any; // You might want to use a more specific type for navigation
} 