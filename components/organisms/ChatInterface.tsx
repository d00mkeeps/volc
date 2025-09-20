import React from "react";
import { Platform, KeyboardAvoidingView } from "react-native";
import { YStack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import { MessageList } from "../molecules/chat/MessageList";
import { InputArea } from "../atoms/chat/InputArea";
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
  keyboardVerticalOffset?: number;
}

export const ChatInterface = ({
  messages = [],
  streamingMessage,
  onSend,
  placeholder = "Type a message...",
  connectionState = "ready",
  queuedMessageCount = 0,
  keyboardVerticalOffset = 120,
}: ChatInterfaceProps) => {
  const getPlaceholder = () => {
    switch (connectionState) {
      case "expecting_ai_message":
        return "Loading...";
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
      keyboardVerticalOffset={
        Platform.OS === "ios" ? keyboardVerticalOffset : 0
      }
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
            textAlign="center"
            color="$textMuted"
            size="medium"
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
