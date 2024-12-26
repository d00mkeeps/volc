import { Message } from "@/types";
import { StyleProp, ViewStyle } from "react-native";
import { UserOnboarding } from "./onboarding";

export type ChatConfigName = 
  | 'onboarding'
  | 'default'
  |'program'
  /* example of new config 
  | 'workout-planner'
  */

interface SignalHandler {
    (type: string, data: any): void
  }
 export  interface ChatUIProps {
    configName: ChatConfigName;
    conversationId?: string;
    title: string;
    subtitle?: string;
    onSignal?: (type: string, data: any) => void;
    showNavigation?: boolean
  }

export interface WorkoutChatProps {
  conversationId: string;
  onSignal?: (type: string, data: any) => void;
}

export interface ExpandedModalProps {
  visible: boolean;
  onClose: () => void;
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
}

export interface InputAreaProps {
  disabled?: boolean;
  onSendMessage: (message: string) => void;
}

export interface WorkoutChatProps {
  conversationId: string;
  onSignal?: (type: string, data: any) => void;
}

export interface HeaderProps {
  title?: string;  // Made optional to match ChatUIProps
  subtitle?: string;
  showNavigation?: boolean,
  onHomePress?: () => void,
  onBackPress?: () => void
}

export interface MessageListProps {
  messages: Message[];
  streamingMessage: Message | null;
  style?: StyleProp<ViewStyle>;
}

export interface ConversationListProps {
  onConversationPress: (id: string) => void;
}

export interface OnboardingChatProps {
  onComplete?: (onboardingData: UserOnboarding) => void;
}
