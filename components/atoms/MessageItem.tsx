// components/atoms/MessageItem.tsx
import React, { memo } from "react";
import { YStack, XStack } from "tamagui";
import { StyleSheet } from "react-native";
import Markdown from "react-native-markdown-display";
import { Message } from "@/types";

interface MessageItemProps {
  message: Message;
  isStreaming?: boolean;
}

export const MessageItem = memo(
  ({ message, isStreaming = false }: MessageItemProps) => {
    const isUser = message.sender === "user";

    const markdownStyles = StyleSheet.create({
      body: {
        fontSize: 16,
        fontWeight: "400",
        lineHeight: 18,
        color: "#ffffff",
        margin: 0,
        padding: 0,
      },
      paragraph: {
        marginVertical: 8,
      },
      heading1: {
        fontSize: 20,
        lineHeight: 24,
        fontWeight: "700",
        paddingVertical: 8,
        color: "#ffffff",
      },
      heading2: {
        fontSize: 18,
        lineHeight: 22,
        fontWeight: "700",
        paddingVertical: 8,
        color: "#ffffff",
      },
      strong: { fontWeight: "800" },
      em: { fontStyle: "italic" },
      code_inline: {
        fontFamily: "monospace",
        backgroundColor: "rgba(255,255,255,0.2)",
        paddingHorizontal: 4,
        borderRadius: 3,
      },
      code_block: {
        fontFamily: "monospace",
        backgroundColor: "rgba(255,255,255,0.2)",
        padding: 8,
        borderRadius: 6,
        marginVertical: 4,
      },
    });

    return (
      <XStack
        width="100%"
        justifyContent={isUser ? "flex-end" : "flex-start"}
        paddingHorizontal="$4"
        paddingVertical="$2"
      >
        <YStack
          maxWidth={"90%"} // Full width for assistant
          backgroundColor={isUser ? "$primary" : "transparent"} // No background for assistant
          paddingHorizontal={isUser ? "$3" : "$0"} // No horizontal padding for assistant
          paddingVertical="$1" // Minimal padding for assistant
          borderRadius={isUser ? "$4" : "$0"} // No border radius for assistant
          opacity={isStreaming ? 0.7 : 1}
        >
          <Markdown style={markdownStyles}>
            {message.content + (isStreaming ? "..." : "")}
          </Markdown>
        </YStack>
      </XStack>
    );
  }
);
