// components/chat/molecules/MessageList.tsx
import React, {
  useCallback,
  useRef,
  useEffect,
  useMemo,
  useState,
} from "react";
import { FlatList } from "react-native";
import { YStack, Text } from "tamagui";
import { MessageItem } from "../../atoms/MessageItem";
import { Message } from "@/types";

interface MessageListProps {
  messages: Message[];
  streamingMessage?: { content: string; isComplete: boolean } | null;
}

export const MessageList = ({
  messages,
  streamingMessage,
}: MessageListProps) => {
  const listRef = useRef<FlatList>(null);

  const allMessages = useMemo(() => {
    if (!streamingMessage) return messages;

    const tempStreamingMessage: Message = {
      id: "streaming",
      content: streamingMessage.content,
      sender: "assistant",
      conversation_id: messages[0]?.conversation_id || "",
      conversation_sequence: messages.length + 1,
      timestamp: new Date(),
    };

    return [...messages, tempStreamingMessage];
  }, [messages, streamingMessage]);

  // Only auto-scroll for new actual messages, not streaming
  useEffect(() => {
    if (allMessages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [allMessages.length]);

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => (
      <MessageItem message={item} isStreaming={item.id === "streaming"} />
    ),
    []
  );
  // Key extractor
  const keyExtractor = useCallback((item: Message) => item.id, []);

  if (allMessages.length === 0) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Text color="$textMuted" fontSize="$4">
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
