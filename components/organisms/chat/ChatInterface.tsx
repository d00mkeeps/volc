import React from "react";
import { Platform, KeyboardAvoidingView } from "react-native";
import { YStack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import { MessageList } from "../../molecules/chat/MessageList";
import { InputArea } from "../../atoms/chat/InputArea";
import { Message } from "@/types";

interface StreamingMessageState {
  conversationId: string;
  content: string;
  isComplete: boolean;
  isProcessing?: boolean;
}

interface ChatInterfaceProps {
  messages?: Message[];
  onTemplateApprove?: (templateData: any) => void;
  streamingMessage?: StreamingMessageState | null;
  onSend: (content: string) => void;
  onRestart?: () => void; // Keep for backward compatibility but won't use
  placeholder?: string;
  connectionState?: "ready" | "expecting_ai_message" | "disconnected";
  queuedMessageCount?: number;
  keyboardVerticalOffset?: number;
  statusMessage?: string | null;
}

export const ChatInterface = ({
  messages = [],
  streamingMessage,
  onSend,
  onTemplateApprove,
  connectionState = "ready",
  statusMessage,
  queuedMessageCount = 0,
  keyboardVerticalOffset = 120,
}: ChatInterfaceProps) => {
  const getStatusText = () => {
    if (queuedMessageCount > 0) {
      return `${queuedMessageCount} message${
        queuedMessageCount > 1 ? "s" : ""
      } queued`;
    }
    return null;
  };

  const shouldShowLoadingIndicator = connectionState === "expecting_ai_message";
  const lastMessage = messages[messages.length - 1];

  // Only disable when actively expecting response or streaming
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
      <YStack flex={1} position="relative">
        <MessageList
          messages={messages}
          streamingMessage={streamingMessage}
          showLoadingIndicator={shouldShowLoadingIndicator}
          connectionState={connectionState}
          onTemplateApprove={onTemplateApprove}
          statusMessage={statusMessage}
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
          isLoading={isInputDisabled}
          onSendMessage={onSend}
          disabled={isInputDisabled}
        />
      </YStack>
    </KeyboardAvoidingView>
  );
};
