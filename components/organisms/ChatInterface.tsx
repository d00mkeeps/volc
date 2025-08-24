import React from "react";
import { Platform, KeyboardAvoidingView } from "react-native";
import { YStack, Text } from "tamagui";
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
  connectionState?: "ready" | "expecting_ai_message";
  queuedMessageCount?: number;
}

export const ChatInterface = ({
  messages = [],
  streamingMessage,
  onSend,
  placeholder = "Type a message...",
  connectionState = "ready",
  queuedMessageCount = 0,
}: ChatInterfaceProps) => {
  const getPlaceholder = () => {
    switch (connectionState) {
      case "expecting_ai_message":
        return "Loading..."; // Simple and clean
      default:
        return placeholder;
    }
  };

  const getStatusText = () => {
    if (queuedMessageCount > 0) {
      return `${queuedMessageCount} message${
        queuedMessageCount > 1 ? "s" : ""
      } queued`;
    }
    return null;
  };

  // Show loading indicator when expecting AI message
  const shouldShowLoadingIndicator = connectionState === "expecting_ai_message";
  const lastMessage = messages[messages.length - 1];
  // Disable input when expecting AI message
  const isInputDisabled =
    connectionState === "expecting_ai_message" ||
    (streamingMessage && !streamingMessage.isComplete) ||
    (lastMessage?.sender === "user" && !streamingMessage);
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 120 : 0}
      style={{ flex: 1 }}
    >
      <YStack flex={1}>
        <MessageList
          messages={messages}
          streamingMessage={streamingMessage}
          showLoadingIndicator={shouldShowLoadingIndicator}
        />

        {getStatusText() && (
          <Text
            ta="center"
            color="$textMuted"
            fontSize="$2"
            paddingVertical="$1"
          >
            {getStatusText()}
          </Text>
        )}

        <InputArea
          placeholder={getPlaceholder()}
          onSendMessage={onSend}
          disabled={isInputDisabled}
        />
      </YStack>
    </KeyboardAvoidingView>
  );
};
