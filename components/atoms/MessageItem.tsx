// components/atoms/MessageItem.tsx
import React, { memo } from "react";
import { YStack, XStack, Text } from "tamagui";
import { Message } from "@/types";

interface MessageItemProps {
  message: Message;
  isStreaming?: boolean;
}

export const MessageItem = memo(
  ({ message, isStreaming = false }: MessageItemProps) => {
    if (!message) return null;

    const isUser = message.sender === "user";

    // Ensure content is a string
    const safeContent =
      typeof message.content === "string"
        ? message.content
        : String(message.content || "");
    const renderContent = safeContent + (isStreaming ? "..." : "");

    return (
      <XStack
        width="100%"
        justifyContent={isUser ? "flex-end" : "flex-start"}
        paddingHorizontal="$4"
        paddingVertical="$2"
      >
        <YStack
          maxWidth={"90%"}
          backgroundColor={isUser ? "$primary" : "transparent"}
          paddingHorizontal={isUser ? "$3" : "$0"}
          paddingVertical="$1"
          borderRadius={isUser ? "$4" : "$0"}
          opacity={isStreaming ? 0.7 : 1}
        >
          <Text
            style={{
              color: "#ffffff",
              fontSize: 16,
              lineHeight: 18,
              fontWeight: "400",
            }}
          >
            {renderContent}
          </Text>
        </YStack>
      </XStack>
    );
  }
);
