import React from "react";
import { Platform, KeyboardAvoidingView } from "react-native";
import { YStack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import { MessageList } from "../molecules/chat/MessageList";
import { InputArea } from "../atoms/chat/InputArea";
import FloatingActionButton from "../atoms/core/FloatingActionButton";
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
  onRestart?: () => void; // Optional restart handler
  placeholder?: string;
  connectionState?: "ready" | "expecting_ai_message" | "disconnected";
  queuedMessageCount?: number;
  keyboardVerticalOffset?: number;
}

export const ChatInterface = ({
  messages = [],
  streamingMessage,
  onSend,
  onRestart,
  placeholder = "Type a message...",
  connectionState = "ready",
  queuedMessageCount = 0,
  keyboardVerticalOffset = 120,
}: ChatInterfaceProps) => {
  const getPlaceholder = () => {
    switch (connectionState) {
      case "disconnected":
        return "Chat disconnected..";
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

  // Disable input when expecting AI message or disconnected
  const isInputDisabled =
    connectionState === "disconnected" ||
    connectionState === "expecting_ai_message" ||
    (streamingMessage && !streamingMessage.isComplete) ||
    (lastMessage?.sender === "user" && !streamingMessage);

  // Show restart button when disconnected
  const shouldShowRestartButton =
    connectionState === "disconnected" && onRestart;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={
        Platform.OS === "ios" ? keyboardVerticalOffset : 0
      }
      style={{ flex: 1 }}
    >
      <YStack flex={1} position="relative">
        <MessageList
          messages={messages}
          streamingMessage={streamingMessage}
          showLoadingIndicator={shouldShowLoadingIndicator}
          connectionState={connectionState}
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

        {shouldShowRestartButton && (
          <YStack
            position="absolute"
            top="50%" // Center vertically
            left={0}
            right={0}
            alignItems="center"
            paddingHorizontal="$4"
            zIndex={10}
            transform={[{ translateY: -30 }]} // Offset by half button height for perfect centering
          >
            <FloatingActionButton
              icon="play"
              label="Restart Chat"
              onPress={onRestart}
            />
          </YStack>
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
