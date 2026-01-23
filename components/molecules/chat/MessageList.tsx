import React, { useCallback, useRef, useEffect, useMemo } from "react";
import { FlatList, Pressable } from "react-native";
import { YStack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import { MessageItem } from "../../atoms/chat/MessageItem";
import { LoadingMessage } from "../../atoms/chat/LoadingMessage";
import { Message } from "@/types";
import { useMessageStore } from "@/stores/chat/MessageStore";
import { useConversationStore } from "@/stores/chat/ConversationStore";
import { ResponsiveKeyboardAvoidingView } from "@/components/atoms/core/ResponsiveKeyboardAvoidingView";
import { Keyboard } from "react-native";

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
  const [keyboardVisible, setKeyboardVisible] = React.useState(false);

  const activeConversationId = useConversationStore(
    (state) => state.activeConversationId,
  );

  const hasStreamingMessage = useMessageStore((state) =>
    activeConversationId
      ? state.streamingMessages.has(activeConversationId)
      : false,
  );

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Build message list and reverse for inverted FlatList (newest at index 0)
  const invertedMessages = useMemo(() => {
    const safeMessages = Array.isArray(messages) ? messages : [];
    let result: Message[] = [...safeMessages];

    if (hasStreamingMessage) {
      const tempStreamingMessage: Message = {
        id: "streaming",
        content: "",
        sender: "assistant",
        conversation_id: activeConversationId!,
        conversation_sequence: safeMessages.length + 1,
        timestamp: new Date(),
      };
      result = [...result, tempStreamingMessage];
    } else if (showLoadingIndicator) {
      const tempLoadingMessage: Message = {
        id: "loading",
        content: "",
        sender: "assistant",
        conversation_id: safeMessages[0]?.conversation_id || "",
        conversation_sequence: safeMessages.length + 1,
        timestamp: new Date(),
      };
      result = [...result, tempLoadingMessage];
    }

    // Reverse so newest message is at index 0 for inverted list
    return result.reverse();
  }, [
    messages,
    hasStreamingMessage,
    showLoadingIndicator,
    activeConversationId,
  ]);

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
    [statusMessage, onTemplateApprove, onProfileConfirm, onDismiss],
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  if (invertedMessages.length === 0 && connectionState !== "disconnected") {
    return (
      <ResponsiveKeyboardAvoidingView style={{ flex: 1 }}>
        <Pressable style={{ flex: 1 }} onPress={onDismiss}>
          <YStack flex={1} justifyContent="center" alignItems="center">
            <Text color="$textMuted" size="medium">
              Start a conversation about your workout
            </Text>
          </YStack>
        </Pressable>
      </ResponsiveKeyboardAvoidingView>
    );
  }

  return (
    <ResponsiveKeyboardAvoidingView style={{ flex: 1 }}>
      <YStack flex={1} position="relative">
        <FlatList
          ref={listRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            // Inverted list: paddingTop becomes visual bottom, paddingBottom becomes visual top
            paddingTop: keyboardVisible ? 130 : 160,
            paddingBottom: 16,
          }}
          data={invertedMessages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          inverted={true}
          // Virtualization props for 100+ message performance
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={5}
          scrollEventThrottle={200}
          removeClippedSubviews={true}
          showsVerticalScrollIndicator={true}
        />
      </YStack>
    </ResponsiveKeyboardAvoidingView>
  );
};
