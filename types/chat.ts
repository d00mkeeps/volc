import { Message } from "@/types";
import { StyleProp, ViewStyle } from "react-native";
import { UserOnboarding } from "./onboarding";
import { ChatConfigKey } from "@/constants/ChatConfigMaps";

export type ChatConfigName = 
  |'onboarding'
  |'default'
  |'workout-analysis'
  |'base'
 
  export interface ChatUIProps {
    configName: ChatConfigName;
    conversationId?: string;
    title?: string;
    subtitle?: string;
    onSignal?: (type: string, data: any) => void;
    showNavigation?: boolean;
    showSidebar?: boolean; // Add this line
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
  onSendMessage: (message: string, config?: any) => Promise<void>;  useModal?: boolean;
  modalTitle?: string;
  customContainerStyle?: ViewStyle,
  selectedConfig?: string;
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
  onBackPress?: () => void,
  onToggleSidebar?: () => void,
  isSidebarOpen: boolean,
  hasNotification: boolean
}

export interface MessageListProps {
  messages: Message[];
  streamingMessage: Message | null;
  style?: StyleProp<ViewStyle>;
  configName?: ChatConfigName
}

export interface ConversationListProps {
  onConversationPress: (id: string) => void;
}

export interface SendMessageOptions {
  detailedAnalysis?: boolean;
  configName?: ChatConfigKey;
}

export interface OnboardingChatProps {
  onComplete?: (onboardingData: UserOnboarding) => void;
}
