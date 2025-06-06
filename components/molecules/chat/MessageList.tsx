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
    let filteredMessages = messages;

    // Filter out initial user message(s)
    if (messages.length > 0 && messages[0].sender === "user") {
      filteredMessages = messages.slice(1);

      // If there's still a duplicate user message, remove it too
      if (
        filteredMessages.length > 0 &&
        filteredMessages[0].sender === "user"
      ) {
        filteredMessages = filteredMessages.slice(1);
      }
    }

    if (!streamingMessage) return filteredMessages;

    const tempStreamingMessage: Message = {
      id: "streaming",
      content: streamingMessage.content,
      sender: "assistant",
      conversation_id: messages[0]?.conversation_id || "", // Use original messages
      conversation_sequence: filteredMessages.length + 1,
      timestamp: new Date(),
    };

    return [...filteredMessages, tempStreamingMessage];
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
