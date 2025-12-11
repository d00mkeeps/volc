// /components/atoms/core/MessageItem.tsx
import React, { memo } from "react";
import { YStack, XStack, useTheme, getTokens } from "tamagui";
import Text from "@/components/atoms/core/Text";
import {
  StyleSheet,
  useWindowDimensions,
  Pressable,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import Markdown from "react-native-markdown-display";
import { Message } from "@/types";
import WorkoutTemplateView from "@/components/molecules/workout/WorkoutTemplateView";
import ProfileConfirmationView from "@/components/molecules/ProfileConfirmationView";
import ChartDataView from "@/components/molecules/visualization/ChartDataView";
import Animated, { FadeIn } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { StreamingMarkdownRenderer } from "@/utils/markdown/streamingMarkdownRenderer";
import { createCustomRules } from "@/utils/markdown/customRules";

interface MessageItemProps {
  message: Message;
  isStreaming?: boolean;
  enableUserMarkdown?: boolean;
  onTemplateApprove?: (templateData: any) => void;
  onProfileConfirm?: () => void;
  onDismiss?: () => void;
}
export const MessageItem = memo(
  ({
    message,
    isStreaming = false,
    enableUserMarkdown = false,
    onTemplateApprove,
    onProfileConfirm,
    onDismiss,
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

    // Markdown styles
    const bodySize = isTablet ? tokens.fontSize.$4.val : tokens.fontSize.$3.val;
    const h2Size = isTablet ? tokens.fontSize.$6.val : tokens.fontSize.$4.val;
    const h1Size = isTablet ? tokens.fontSize.$8.val : tokens.fontSize.$6.val;

    const markdownStyles = StyleSheet.create({
      body: {
        fontSize: bodySize,
        fontWeight: "400",
        lineHeight: bodySize * 1.4,
        color: isUser ? "#ffffff" : theme.color.get(),
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
      fence: {
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
      code_container: {
        backgroundColor: "transparent",
        borderRadius: 0,
        margin: 0,
        padding: 0,
      },
      pre: {
        backgroundColor: "transparent",
        borderRadius: 0,
        margin: 0,
        padding: 0,
      },
    });
    const customRules = createCustomRules({
      isStreaming,
      onTemplateApprove,
      onProfileConfirm,
      styles: markdownStyles,
    });
    return (
      <Pressable onPress={onDismiss} style={{ width: "100%" }}>
        <XStack
          width="100%"
          justifyContent={isUser ? "flex-end" : "flex-start"}
          paddingHorizontal="$4"
          paddingVertical="$1"
          pointerEvents="box-none"
        >
          {isUser ? (
            <TouchableOpacity
              disabled
              style={{
                maxWidth: "90%",
                opacity: isStreaming ? 0.7 : 1,
                overflow: "hidden",
                backgroundColor: `${theme.primary.get()}80`,
                borderRadius: 8,
              }}
            >
              <BlurView
                intensity={60}
                tint={useColorScheme() === "dark" ? "dark" : "light"}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 8,
                  overflow: "hidden",
                  borderColor: theme.primary.get(),
                  borderWidth: 0.5,
                }}
              >
                {enableUserMarkdown ? (
                  <Markdown style={markdownStyles} rules={customRules}>
                    {renderContent}
                  </Markdown>
                ) : (
                  <Text
                    color="white"
                    fontSize={bodySize}
                    fontWeight="400"
                    lineHeight={bodySize * 1.4}
                  >
                    {renderContent}
                  </Text>
                )}
              </BlurView>
            </TouchableOpacity>
          ) : (
            <YStack maxWidth={"90%"}>
              {isStreaming ? (
                <StreamingMarkdownRenderer
                  content={safeContent}
                  styles={markdownStyles}
                  onTemplateApprove={onTemplateApprove}
                  onProfileConfirm={onProfileConfirm}
                />
              ) : (
                <Markdown style={markdownStyles} rules={customRules}>
                  {renderContent}
                </Markdown>
              )}
            </YStack>
          )}
        </XStack>
      </Pressable>
    );
  }
);
