import React, { useCallback, useRef, useEffect, useMemo } from "react";
import { FlatList } from "react-native";
import { YStack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import { MessageItem } from "../../atoms/chat/MessageItem";
import { LoadingMessage } from "../../atoms/chat/LoadingMessage";
import { Message } from "@/types";

interface MessageListProps {
  messages: Message[];
  streamingMessage?: { content: string; isComplete: boolean } | null;
  showLoadingIndicator?: boolean;
  connectionState?: "ready" | "expecting_ai_message" | "disconnected"; // NEW
}

export const MessageList = ({
  messages,
  streamingMessage,
  showLoadingIndicator = false,
  connectionState = "ready", // NEW
}: MessageListProps) => {
  const listRef = useRef<FlatList>(null);

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

  useEffect(() => {
    if (allMessages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [allMessages.length]);

  const renderMessage = useCallback(({ item }: { item: Message }) => {
    if (!item) return null;

    if (item.id === "loading") {
      return <LoadingMessage />;
    }

    return <MessageItem message={item} isStreaming={item.id === "streaming"} />;
  }, []);

  const keyExtractor = useCallback((item: Message) => item.id, []);

  // Don't show empty state when disconnected
  if (allMessages.length === 0 && connectionState !== "disconnected") {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Text color="$textMuted" size="medium">
          Start a conversation about your workout
        </Text>
      </YStack>
    );
  }

  return (
    <YStack flex={1} position="relative">
      <FlatList
        style={{ flex: 1 }}
        ref={listRef}
        data={allMessages}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        scrollEventThrottle={400}
        removeClippedSubviews={true}
        contentContainerStyle={{
          paddingVertical: 16,
        }}
        showsVerticalScrollIndicator={true}
      />
    </YStack>
  );
};
