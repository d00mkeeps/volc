import React, { memo } from "react";
import { YStack, XStack, useTheme, getTokens } from "tamagui";
import Text from "@/components/atoms/core/Text";
import { StyleSheet, useWindowDimensions } from "react-native";
import Markdown from "react-native-markdown-display";
import { Message } from "@/types";

interface MessageItemProps {
  message: Message;
  isStreaming?: boolean;
  enableUserMarkdown?: boolean; // New prop to control user markdown
}

export const MessageItem = memo(
  ({
    message,
    isStreaming = false,
    enableUserMarkdown = false,
  }: MessageItemProps) => {
    if (!message) return null;

    const theme = useTheme();
    const tokens = getTokens();
    const { width } = useWindowDimensions();
    const isUser = message.sender === "user";

    const isTablet = width >= 768;

    const safeContent =
      typeof message.content === "string"
        ? message.content
        : String(message.content || "");

    const renderContent = safeContent + (isStreaming ? "..." : "");

    // Use fontSize tokens for markdown
    const bodySize = isTablet ? tokens.fontSize.$4.val : tokens.fontSize.$3.val;
    const h2Size = isTablet ? tokens.fontSize.$6.val : tokens.fontSize.$4.val;
    const h1Size = isTablet ? tokens.fontSize.$8.val : tokens.fontSize.$6.val;

    const markdownStyles = StyleSheet.create({
      body: {
        fontSize: bodySize,
        fontWeight: "400",
        lineHeight: bodySize * 1.4,
        color: isUser ? "#ffffff" : theme.color.get(), // White for user, theme-responsive for assistant
        margin: 0,
        padding: 0,
      },
      paragraph: {
        marginVertical: 8,
      },
      heading1: {
        fontSize: h1Size,
        lineHeight: h1Size * 1.2,
        fontWeight: "600",
        paddingVertical: 8,
        color: isUser ? "#ffffff" : theme.color.get(),
      },
      heading2: {
        fontSize: h2Size,
        lineHeight: h2Size * 1.3,
        fontWeight: "600",
        paddingVertical: 8,
        color: isUser ? "#ffffff" : theme.color.get(),
      },
      strong: {
        fontWeight: "600",
        color: isUser ? "#ffffff" : theme.color.get(),
      },
      em: {
        fontStyle: "italic",
        color: isUser ? "#ffffff" : theme.color.get(),
      },
      code_inline: {
        fontFamily: "monospace",
        backgroundColor: isUser
          ? "rgba(255,255,255,0.2)"
          : theme.backgroundStrong.get(),
        color: isUser ? "#ffffff" : theme.color.get(),
        paddingHorizontal: 4,
        borderRadius: 3,
        fontSize: bodySize,
      },
      code_block: {
        fontFamily: "monospace",
        backgroundColor: isUser
          ? "rgba(255,255,255,0.2)"
          : theme.backgroundStrong.get(),
        color: isUser ? "#ffffff" : theme.color.get(),
        padding: 8,
        borderRadius: 6,
        marginVertical: 4,
        fontSize: bodySize,
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
          maxWidth={"90%"}
          backgroundColor={isUser ? "$primary" : "transparent"}
          paddingHorizontal={isUser ? "$3" : "$0"}
          paddingVertical="$2"
          borderRadius={isUser ? "$4" : "$0"}
          opacity={isStreaming ? 0.7 : 1}
        >
          {isUser && !enableUserMarkdown ? (
            // User messages: Use your Text component with proper sizing
            <Text
              size="medium" // Better size than small
              color="white"
              fontWeight="500"
            >
              {renderContent}
            </Text>
          ) : (
            // Assistant messages OR user messages with markdown enabled
            <Markdown style={markdownStyles}>{renderContent}</Markdown>
          )}
        </YStack>
      </XStack>
    );
  }
);
