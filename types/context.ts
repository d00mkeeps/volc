import { Message, UserProfile } from "@/types";
import { ChatConfigName } from "./chat";
import { ConnectionState, MessageHandler } from "./core";

export interface MessageContextType {
  messages: Message[];
  streamingMessage: Message | null;
  connectionState: ConnectionState;
  registerMessageHandler: (handler: MessageHandler | null) => void;
  sendMessage: (content: string) => void;
  connect: (configName: ChatConfigName, conversationId?: string) => Promise<void>;
}

export interface UserContextType {
  userProfile: UserProfile | null
  loading: boolean
  error: Error | null
  refreshProfile: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
}

