// components/chat/molecules/MessageList.tsx
import React, { useCallback, useRef, useEffect, useMemo } from "react";
import { FlatList } from "react-native";
import { YStack, Button, Text } from "tamagui";
import { ChevronDown } from "@tamagui/lucide-icons";
import { MessageItem } from "../atoms/MessageItem";
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
  const [showScrollButton, setShowScrollButton] = React.useState(false);

  // Combine messages with streaming message
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

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(
    (animated = true) => {
      if (allMessages.length > 0) {
        listRef.current?.scrollToEnd({ animated });
      }
    },
    [allMessages.length]
  );

  // Auto-scroll when new messages arrive
  useEffect(() => {
    scrollToBottom(false);
  }, [allMessages.length, scrollToBottom]);

  // Handle scroll events to show/hide scroll button
  const handleScroll = useCallback(
    (event: any) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;
      const isNearBottom =
        contentOffset.y + layoutMeasurement.height >= contentSize.height - 100;
      setShowScrollButton(!isNearBottom && allMessages.length > 5);
    },
    [allMessages.length]
  );

  // Render individual message
  const renderMessage = useCallback(
    ({ item }: { item: Message }) => (
      <MessageItem message={item} isStreaming={item.id === "streaming"} />
    ),
    []
  );

  // Item separator for more gap between messages
  const ItemSeparator = useCallback(() => <YStack height="$2" />, []);

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
        ref={listRef}
        data={allMessages}
        renderItem={renderMessage}
        ItemSeparatorComponent={ItemSeparator}
        keyExtractor={keyExtractor}
        onScroll={handleScroll}
        scrollEventThrottle={400}
        onContentSizeChange={() => scrollToBottom(false)}
        onLayout={() => scrollToBottom(false)}
        removeClippedSubviews={true}
        contentContainerStyle={{
          paddingVertical: 16,
        }}
        showsVerticalScrollIndicator={false}
      />

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <Button
          position="absolute"
          bottom="$4"
          right="$4"
          size="$3"
          circular
          backgroundColor="$primary"
          onPress={() => scrollToBottom(true)}
          elevation="$4"
          pressStyle={{ scale: 0.95 }}
        >
          <ChevronDown size="$1" color="white" />
        </Button>
      )}
    </YStack>
  );
};
