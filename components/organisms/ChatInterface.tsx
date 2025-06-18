import React from "react";
import { Platform, KeyboardAvoidingView } from "react-native";
import { YStack } from "tamagui";
import { MessageList } from "../molecules/chat/MessageList";
import { InputArea } from "../atoms/InputArea";
import { Message } from "@/types";

interface StreamingMessageState {
  conversationId: string;
  content: string;
  isComplete: boolean;
  isProcessing?: boolean;
}

interface ChatInterfaceProps {
  messages?: Message[];
  streamingMessage?: StreamingMessageState | null;
  onSend: (content: string) => void;
  placeholder?: string;
}

export const ChatInterface = ({
  messages = [],
  streamingMessage,
  onSend,
  placeholder = "Type a message...",
}: ChatInterfaceProps) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      style={{ flex: 1 }}
    >
      <YStack flex={1}>
        <MessageList messages={messages} streamingMessage={streamingMessage} />
        <InputArea placeholder={placeholder} onSendMessage={onSend} />
      </YStack>
    </KeyboardAvoidingView>
  );
};
