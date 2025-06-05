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

    // Markdown styles with StyleSheet (better text color for assistant, increased weight)
    const markdownStyles = StyleSheet.create({
      body: {
        fontSize: 16,
        fontWeight: "500", // Increased from default
        lineHeight: 22,
        color: isUser ? "#ffffff" : "#ffffff", // White text for assistant messages too
        margin: 0,
        padding: 0,
      },
      paragraph: {
        marginVertical: 2,
        marginTop: 0,
        marginBottom: 4,
      },
      heading1: {
        fontSize: 20,
        fontWeight: "700",
        marginVertical: 4,
        color: "#ffffff",
      },
      heading2: {
        fontSize: 18,
        fontWeight: "700",
        marginVertical: 3,
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
        paddingVertical="$1"
      >
        <YStack
          maxWidth="80%"
          backgroundColor={isUser ? "$primary" : "$backgroundSoft"}
          paddingHorizontal="$3"
          paddingVertical="$1.5" // Reduced from $2.5 (about 30% reduction)
          borderRadius="$4"
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
