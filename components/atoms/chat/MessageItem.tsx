// /components/atoms/core/MessageItem.tsx
import React, { memo } from "react";
import { YStack, XStack, useTheme, getTokens } from "tamagui";
import Text from "@/components/atoms/core/Text";
import { StyleSheet, useWindowDimensions } from "react-native";
import Markdown from "react-native-markdown-display";
import { Message } from "@/types";
import WorkoutTemplateView from "@/components/molecules/workout/WorkoutTemplateView";
import ProfileConfirmationView from "@/components/molecules/ProfileConfirmationView";

interface MessageItemProps {
  message: Message;
  isStreaming?: boolean;
  enableUserMarkdown?: boolean;
  onTemplateApprove?: (templateData: any) => void;
  onProfileConfirm?: () => void;
}

export const MessageItem = memo(
  ({
    message,
    isStreaming = false,
    enableUserMarkdown = false,
    onTemplateApprove,
    onProfileConfirm,
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

    // CUSTOM RULES WITH FENCE SUPPORT
    const customRules = {
      paragraph: (node: any, children: any, parent: any, styles: any) => {
        return (
          <YStack key={node.key} style={styles.paragraph}>
            {children}
          </YStack>
        );
      },

      fence: (node: any, children: any, parent: any, styles: any) => {
        if (isStreaming) {
          // Try to detect if this looks like it might be a component
          const content = node.content.trim();
          const looksLikeJSON =
            content.startsWith("{") || content.startsWith("[");

          if (looksLikeJSON) {
            try {
              const parsed = JSON.parse(content);

              // Handle workout_template
              if (parsed.type === "workout_template") {
                return (
                  <WorkoutTemplateView
                    key={node.key}
                    data={parsed.data}
                    onApprove={onTemplateApprove}
                  />
                );
              }

              // Handle onboarding_complete (updated from profile_confirmation)
              if (parsed.type === "onboarding_complete") {
                return (
                  <ProfileConfirmationView
                    key={node.key}
                    data={parsed.data}
                    onComplete={onProfileConfirm}
                  />
                );
              }
            } catch (e) {
              // JSON is incomplete - show loading indicator
              return (
                <YStack
                  key={node.key}
                  style={styles.fence}
                  justifyContent="center"
                  alignItems="center"
                  padding="$4"
                >
                  <Text color="$textSoft" size="small">
                    loading...
                  </Text>
                </YStack>
              );
            }
          }

          // For non-JSON code blocks, show the raw content
          return (
            <YStack key={node.key} style={styles.fence}>
              <Text style={styles.fence}>{node.content}</Text>
            </YStack>
          );
        }

        // Normal (non-streaming) rendering
        try {
          const parsed = JSON.parse(node.content);

          if (parsed.type === "workout_template") {
            return (
              <WorkoutTemplateView
                key={node.key}
                data={parsed.data}
                onApprove={onTemplateApprove}
              />
            );
          }

          // Handle onboarding_complete (updated from profile_confirmation)
          if (parsed.type === "onboarding_complete") {
            return (
              <ProfileConfirmationView
                key={node.key}
                data={parsed.data}
                onComplete={onProfileConfirm}
              />
            );
          }
        } catch (e) {
          // Silent fail, fall back to default rendering
        }

        // Default fence rendering
        return (
          <YStack key={node.key} style={styles.fence}>
            <Text style={styles.fence}>{node.content}</Text>
          </YStack>
        );
      },
      code_block: (node: any, children: any, parent: any, styles: any) => {
        return (
          <YStack key={node.key} style={styles.code_block}>
            <Text style={styles.code_block}>{node.content}</Text>
          </YStack>
        );
      },
    };

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

    return (
      <XStack
        width="100%"
        justifyContent={isUser ? "flex-end" : "flex-start"}
        paddingHorizontal="$4"
        paddingVertical="$1"
      >
        <YStack
          maxWidth={"90%"}
          backgroundColor={isUser ? "$primary" : "transparent"}
          paddingHorizontal={isUser ? "$3" : "$0"}
          paddingVertical="$1"
          borderRadius={isUser ? "$4" : "$0"}
          opacity={isStreaming ? 0.7 : 1}
        >
          {isUser && !enableUserMarkdown ? (
            <Text
              color="white"
              fontSize={bodySize}
              fontWeight="400"
              lineHeight={bodySize * 1.4}
            >
              {renderContent}
            </Text>
          ) : (
            <Markdown style={markdownStyles} rules={customRules}>
              {renderContent}
            </Markdown>
          )}
        </YStack>
      </XStack>
    );
  }
);
