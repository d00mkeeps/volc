import React, { useCallback, useRef, useEffect, useMemo } from "react";
import { FlatList, Pressable } from "react-native";
import { YStack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import { MessageItem } from "../../atoms/chat/MessageItem";
import { LoadingMessage } from "../../atoms/chat/LoadingMessage";
import { Message } from "@/types";
import { useMessageStore } from "@/stores/chat/MessageStore";
import { useConversationStore } from "@/stores/chat/ConversationStore";

interface MessageListProps {
  messages: Message[];
  showLoadingIndicator?: boolean;
  connectionState?: "ready" | "expecting_ai_message" | "disconnected";
  onTemplateApprove?: (templateData: any) => void;
  statusMessage?: string | null;
  onProfileConfirm?: () => void;
  onDismiss?: () => void;
}

export const MessageList = ({
  messages,
  showLoadingIndicator = false,
  onProfileConfirm,
  connectionState = "ready",
  statusMessage,
  onTemplateApprove,
  onDismiss,
}: MessageListProps) => {
  const listRef = useRef<FlatList>(null);
  const scrollTimeoutRef = useRef<number | null>(null);

  const activeConversationId = useConversationStore(
    (state) => state.activeConversationId
  );

  const hasStreamingMessage = useMessageStore((state) =>
    activeConversationId
      ? state.streamingMessages.has(activeConversationId)
      : false
  );

  const countRef = useRef(0);
  countRef.current += 1;
  const now = new Date();
  const timestamp = `${now.getMinutes()}:${now
    .getSeconds()
    .toString()
    .padStart(2, "0")}.${now.getMilliseconds().toString().padStart(3, "0")}`;
  console.log(`[MessageList] render #${countRef.current} at ${timestamp}`);

  const allMessages = useMemo(() => {
    const safeMessages = Array.isArray(messages) ? messages : [];

    if (hasStreamingMessage) {
      const tempStreamingMessage: Message = {
        id: "streaming",
        content: "",
        sender: "assistant",
        conversation_id: activeConversationId!,
        conversation_sequence: safeMessages.length + 1,
        timestamp: new Date(),
      };
      return [...safeMessages, tempStreamingMessage];
    }

    const shouldShowLoading = showLoadingIndicator;

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
  }, [
    messages,
    hasStreamingMessage,
    showLoadingIndicator,
    activeConversationId,
  ]);

  const scrollToBottom = useCallback((animated = true) => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      listRef.current?.scrollToOffset({
        offset: Number.MAX_SAFE_INTEGER,
        animated,
      });
    }, 200);
  }, []);

  useEffect(() => {
    if (allMessages.length > 0) {
      scrollToBottom();
    }
  }, [allMessages.length, scrollToBottom]);

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

      const isStreamingMessage = item.id === "streaming";

      return (
        <MessageItem
          message={item}
          isStreaming={isStreamingMessage}
          onTemplateApprove={onTemplateApprove}
          onProfileConfirm={onProfileConfirm}
          onDismiss={onDismiss}
        />
      );
    },
    [statusMessage, onTemplateApprove, onProfileConfirm, onDismiss]
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  if (allMessages.length === 0 && connectionState !== "disconnected") {
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
    <YStack flex={1} position="relative" paddingBottom={110}>
      <FlatList
        ref={listRef}
        style={{ flex: 1 }}
        data={allMessages}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        scrollEventThrottle={200}
        removeClippedSubviews={true}
        showsVerticalScrollIndicator={true}
        onContentSizeChange={() => scrollToBottom()}
        onLayout={() => scrollToBottom(false)}
      />
    </YStack>
  );
};
