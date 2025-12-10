import React, { useEffect } from "react";
import { YStack } from "tamagui";
import { ScrollView } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { MessageItem } from "@/components/atoms/chat/MessageItem";
import { GreetingSkeleton } from "@/components/atoms/chat/SkeletonLoader";
import { Message } from "@/types";
import { useChatStore } from "@/stores/chat/ChatStore";
import { useMessageStore } from "@/stores/chat/MessageStore";
import { useConversationStore } from "@/stores/chat/ConversationStore";
import { useLayoutStore } from "@/stores/layoutStore";
import { useColorScheme } from "react-native";

interface __DisplayMessageProps__ {
  maxHeight?: number;
  onPress?: () => void;
}

export const DisplayMessage: React.FC<__DisplayMessageProps__> = ({
  maxHeight,
  onPress,
}) => {
  const fadeIn = useSharedValue(0);
  const colorScheme = useColorScheme();

  // Selectors
  const isLoading = useConversationStore((state) => state.isLoading);
  const greeting = useChatStore((state) => state.greeting);
  const loadingState = useChatStore((state) => state.loadingState);
  const isStreaming = loadingState === "streaming";
  const streamingContent = useChatStore((state) => state.streamingContent);
  const activeConversationId = useConversationStore(
    (state) => state.activeConversationId
  );
  const recentMessages = useMessageStore((state) =>
    activeConversationId ? state.messages.get(activeConversationId) : []
  );

  // Get input area height to add bottom padding
  const inputAreaHeight = useLayoutStore((state) => state.inputAreaHeight);
  const quickActionsHeight = useLayoutStore(
    (state) => state.quickActionsHeight
  );

  // Calculate total bottom spacing needed
  const bottomSpacing = inputAreaHeight;

  // Fade in animation when content is ready
  useEffect(() => {
    if (!isLoading && greeting) {
      fadeIn.value = withTiming(1, { duration: 200 });
    } else {
      fadeIn.value = 0;
    }
  }, [isLoading, greeting]);

  const fadeInStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
  }));

  const displayMessage: Message | null = React.useMemo(() => {
    if (isLoading || !greeting) return null;

    // Show streaming content if actively streaming
    if (isStreaming && streamingContent) {
      return {
        id: "streaming",
        conversation_id: "temp",
        content: streamingContent,
        sender: "assistant",
        timestamp: new Date(),
        conversation_sequence: 0,
      } as Message;
    }

    // Show last AI message if active conversation
    if (activeConversationId && recentMessages && recentMessages.length > 0) {
      const lastAiMsg = [...recentMessages]
        .reverse()
        .find((m) => m.sender === "assistant");
      if (lastAiMsg) return lastAiMsg;
    }

    // Show greeting only if no active conversation or no AI messages yet
    return {
      id: "greeting",
      conversation_id: "temp",
      content: greeting,
      sender: "assistant",
      timestamp: new Date(),
      conversation_sequence: 0,
    } as Message;
  }, [
    activeConversationId,
    recentMessages,
    greeting,
    isLoading,
    isStreaming,
    streamingContent,
  ]);

  return (
    <YStack
      backgroundColor="$transparent"
      onPress={onPress}
      cursor="pointer"
      overflow="hidden"
      maxHeight={maxHeight}
      position="relative"
      flex={1}
    >
      {isLoading || !displayMessage ? (
        <GreetingSkeleton />
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{
              paddingBottom: bottomSpacing,
            }}
            style={{ flex: 1 }}
          >
            <Animated.View style={fadeInStyle}>
              <MessageItem message={displayMessage} isStreaming={isStreaming} />
            </Animated.View>
          </ScrollView>

          {/* Top Blur Gradient - fades from blur to clear */}
          <YStack
            position="absolute"
            top={0}
            left={0}
            right={0}
            height={60}
            pointerEvents="none"
            zIndex={100}
          >
            <MaskedView
              style={{ flex: 1 }}
              maskElement={
                <LinearGradient
                  colors={["black", "transparent"]}
                  locations={[0, 1]}
                  style={{ flex: 1 }}
                />
              }
            >
              <BlurView
                intensity={80}
                tint={colorScheme === "dark" ? "dark" : "light"}
                style={{ flex: 1 }}
              />
            </MaskedView>
          </YStack>

          {/* Bottom Blur Gradient - fades from clear to blur */}
          <YStack
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            height={80}
            pointerEvents="none"
            zIndex={100}
          >
            <MaskedView
              style={{ flex: 1 }}
              maskElement={
                <LinearGradient
                  colors={["transparent", "black"]}
                  locations={[0, 1]}
                  style={{ flex: 1 }}
                />
              }
            >
              <BlurView
                intensity={80}
                tint={colorScheme === "dark" ? "dark" : "light"}
                style={{ flex: 1 }}
              />
            </MaskedView>
          </YStack>
        </>
      )}
    </YStack>
  );
};
