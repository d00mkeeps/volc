import React, { useCallback, useRef, useEffect, useMemo } from "react";
import { FlatList, Pressable } from "react-native";
import { YStack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import { MessageItem } from "../../atoms/chat/MessageItem";
import { LoadingMessage } from "../../atoms/chat/LoadingMessage";
import { Message } from "@/types";

interface MessageListProps {
  messages: Message[];
  streamingMessage?: { content: string; isComplete: boolean } | null;
  showLoadingIndicator?: boolean;
  connectionState?: "ready" | "expecting_ai_message" | "disconnected";
  onTemplateApprove?: (templateData: any) => void;
  statusMessage?: string | null;
  onProfileConfirm?: () => void;
  onDismiss?: () => void;
}

export const MessageList = ({
  messages,
  streamingMessage,
  showLoadingIndicator = false,
  onProfileConfirm,
  connectionState = "ready",
  statusMessage,
  onTemplateApprove,
  onDismiss,
}: MessageListProps) => {
  const listRef = useRef<FlatList>(null);
  const scrollTimeoutRef = useRef<number | null>(null);

  const allMessages = useMemo(() => {
    const safeMessages = Array.isArray(messages) ? messages : [];

    if (streamingMessage) {
      const tempStreamingMessage: Message = {
        id: "streaming",
        content: streamingMessage.content || "",
        sender: "assistant",
        conversation_id: safeMessages[0]?.conversation_id || "",
        conversation_sequence: safeMessages.length + 1,
        timestamp: new Date(),
      };
      return [...safeMessages, tempStreamingMessage];
    }

    const lastMessage = safeMessages[safeMessages.length - 1];
    const shouldShowLoading =
      showLoadingIndicator || lastMessage?.sender === "user";

    if (shouldShowLoading) {
      const tempLoadingMessage: Message = {
        id: "loading",
        content: "",
        sender: "assistant",
        conversation_id: safeMessages[0]?.conversation_id || "",
        conversation_sequence: safeMessages.length + 1,
        timestamp: new Date(),
      };
      return [...safeMessages, tempLoadingMessage];
    }

    return safeMessages;
  }, [messages, streamingMessage, showLoadingIndicator]);

  // Smooth scroll helper with debouncing
  const scrollToBottom = useCallback((animated = true) => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      // Use w/o animation for initial render to prevent jumpiness
      listRef.current?.scrollToEnd({ animated });
    }, 20); // Small delay to batch rapid updates
  }, []);

  // Scroll when new messages arrive
  useEffect(() => {
    if (allMessages.length > 0) {
      scrollToBottom();
    }
  }, [allMessages.length, scrollToBottom]);

  // Scroll when streaming content updates
  useEffect(() => {
    if (streamingMessage?.content) {
      scrollToBottom();
    }
  }, [streamingMessage?.content, scrollToBottom]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
      if (!item) return null;

      if (item.id === "loading") {
        return <LoadingMessage statusMessage={statusMessage} />;
      }

      return (
        <MessageItem
          message={item}
          isStreaming={item.id === "streaming"}
          onTemplateApprove={onTemplateApprove}
          onProfileConfirm={onProfileConfirm}
          onDismiss={onDismiss}
        />
      );
    },
    [statusMessage, onTemplateApprove, onProfileConfirm, onDismiss]
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  // Don't show empty state when disconnected if there are no messages
  if (allMessages.length === 0 && connectionState !== "disconnected") {
    // We can also make this dismissible by wrapping it
    return (
      <Pressable style={{ flex: 1 }} onPress={onDismiss}>
        <YStack flex={1} justifyContent="center" alignItems="center">
          <Text color="$textMuted" size="medium">
            Start a conversation about your workout
          </Text>
        </YStack>
      </Pressable>
    );
  }

  return (
    <YStack flex={1} position="relative">
      <FlatList
        ref={listRef}
        style={{ flex: 1 }}
        data={allMessages}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        scrollEventThrottle={100}
        removeClippedSubviews={true}
        showsVerticalScrollIndicator={true}
        onContentSizeChange={() => scrollToBottom()}
        onLayout={() => scrollToBottom(false)}
      />
    </YStack>
  );
};
