import React, { useCallback, useRef, useEffect, useMemo } from "react";
import { FlatList, Pressable } from "react-native";
import { YStack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import { MessageItem } from "../../atoms/chat/MessageItem";
import { LoadingMessage } from "../../atoms/chat/LoadingMessage";
import { ThinkingIndicator } from "../../atoms/chat/ThinkingIndicator";
import { Message } from "@/types";
import { useMessageStore } from "@/stores/chat/MessageStore";
import { useConversationStore } from "@/stores/chat/ConversationStore";
import { ResponsiveKeyboardAvoidingView } from "@/components/atoms/core/ResponsiveKeyboardAvoidingView";
import { Keyboard } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNetworkQuality } from "@/hooks/useNetworkQuality";
import { useLayoutStore } from "@/stores/layoutStore";

interface MessageListProps {
  messages: Message[];
  showLoadingIndicator?: boolean;
  connectionState?: "ready" | "expecting_ai_message" | "disconnected";
  onTemplateApprove?: (templateData: any) => void;
  statusMessage?: string | null;
  onProfileConfirm?: () => void;
  onDismiss?: () => void;
  isThinking?: boolean;
  thinkingStartTime?: number | null;
  currentThought?: string;
}

export const MessageList = ({
  messages,
  showLoadingIndicator = false,
  onProfileConfirm,
  connectionState = "ready",
  statusMessage,
  onTemplateApprove,
  onDismiss,
  isThinking = false,
  thinkingStartTime = null,
  currentThought = "",
}: MessageListProps) => {
  const listRef = useRef<FlatList>(null);
  const [keyboardVisible, setKeyboardVisible] = React.useState(false);
  const { isUnreliable } = useNetworkQuality();
  const insets = useSafeAreaInsets();

  // Layout store values for dynamic padding
  const tabBarHeight = useLayoutStore((state) => state.tabBarHeight);
  const quickActionsHeight = useLayoutStore(
    (state) => state.quickActionsHeight,
  );
  const inputAreaHeight = useLayoutStore((state) => state.inputAreaHeight);

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
    }

    // Reverse so newest message is at index 0 for inverted list
    return result.reverse();
  }, [messages, hasStreamingMessage, activeConversationId]);

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
      if (!item) return null;

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
    [onTemplateApprove, onProfileConfirm, onDismiss],
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  if (invertedMessages.length === 0 && connectionState !== "disconnected") {
    return (
      <ResponsiveKeyboardAvoidingView style={{ flex: 1 }}>
        <Pressable style={{ flex: 1 }} onPress={onDismiss}>
          <YStack flex={1} justifyContent="center" alignItems="center">
            <Text color="$textMuted" size="medium">
              {isUnreliable
                ? "You're offline. Please reconnect to chat."
                : "Start a conversation about your workout"}
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
            // Calculation: InputArea + QCA + Bottom Offset (TabBar/Insets) + Buffer
            paddingTop: (() => {
              const bottomOffset = keyboardVisible
                ? 8 // Smaller buffer when keyboard is up
                : (tabBarHeight || insets.bottom) + 8;

              // We add InputArea height (dynamic)
              // We add QuickActions height (dynamic) - assuming it's visible if it has height
              // Plus a buffer for the ThinkingIndicator itself to clear the QCA
              return inputAreaHeight + quickActionsHeight + bottomOffset + 20;
            })(),
            paddingBottom: 20, // Visual top padding
          }}
          data={invertedMessages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          inverted={true}
          ListHeaderComponent={
            <ThinkingIndicator
              isThinking={isThinking}
              showLoadingIndicator={showLoadingIndicator}
              thinkingStartTime={thinkingStartTime}
              currentThought={currentThought}
              statusMessage={statusMessage}
            />
          }
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
