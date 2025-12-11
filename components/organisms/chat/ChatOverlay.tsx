import React, { useState, useEffect, useCallback } from "react";
import {
  Keyboard,
  StyleSheet,
  TouchableWithoutFeedback,
  BackHandler,
  View,
} from "react-native";
import { YStack } from "tamagui";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from "react-native-reanimated";

import { MessageList } from "../../molecules/chat/MessageList";
import { InputArea } from "../../atoms/chat/InputArea";
import { useChatStore } from "@/stores/chat/ChatStore";
import { useConversationStore } from "@/stores/chat/ConversationStore";
import { QuickChatActions } from "@/components/molecules/home/QuickChatActions";
import { useMessageStore } from "@/stores/chat/MessageStore";
import { scheduleOnRN } from "react-native-worklets";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { ResponsiveKeyboardAvoidingView } from "@/components/atoms/core/ResponsiveKeyboardAvoidingView";
import { useLayoutStore } from "@/stores/layoutStore";
import { useWindowDimensions } from "react-native";

interface ChatOverlayProps {
  placeholder?: string;
  currentPage?: number;
}

export const ChatOverlay = ({
  placeholder = "Ask me anything...",
  currentPage = 0,
}: ChatOverlayProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // ChatStore selectors
  const loadingState = useChatStore((state) => state.loadingState);
  const greeting = useChatStore((state) => state.greeting);
  const actions = useChatStore((state) => state.actions);
  const isLoadingActions = useChatStore((state) => state.isLoadingActions);
  const connectionState = useChatStore((state) => state.connectionState);
  const statusMessage = useChatStore((state) => state.statusMessage);
  const connect = useChatStore((state) => state.connect);
  const disconnect = useChatStore((state) => state.disconnect);
  const sendMessage = useChatStore((state) => state.sendMessage);

  const tabBarHeight = useLayoutStore((state) => state.tabBarHeight);
  const setExpandChatOverlay = useLayoutStore(
    (state) => state.setExpandChatOverlay
  );
  const setInputAreaHeight = useLayoutStore(
    (state) => state.setInputAreaHeight
  );

  const { height: screenHeight } = useWindowDimensions();
  const fadeProgress = useSharedValue(0);

  const pendingChatOpen = useConversationStore(
    (state) => state.pendingChatOpen
  );
  const setPendingChatOpen = useConversationStore(
    (state) => state.setPendingChatOpen
  );
  const isWorkoutActive = useUserSessionStore((state) => state.isActive);
  const isWorkoutDetailOpen = useUserSessionStore(
    (state) => state.isWorkoutDetailOpen
  );

  const isHome = currentPage === 0;
  const pageProgress = useSharedValue(isHome ? 1 : 0);
  const activeConversationId = useConversationStore(
    (state) => state.activeConversationId
  );

  const messages =
    useMessageStore((state) =>
      activeConversationId
        ? state.messages.get(activeConversationId)
        : undefined
    ) || [];

  const streamingMessage = useMessageStore((state) =>
    activeConversationId
      ? state.streamingMessages.get(activeConversationId)
      : undefined
  );

  // Computed state
  const canSend = loadingState === "idle";
  const showLoading = loadingState === "pending";
  const isStreaming = loadingState === "streaming";

  const handleQuickReply = useCallback(
    (text: string) => {
      const activeId = useConversationStore.getState().activeConversationId;

      if (!activeId) {
        useConversationStore.getState().setPendingGreeting(greeting);
      }

      useConversationStore.getState().setPendingInitialMessage(text);
      useConversationStore.getState().setPendingChatOpen(true);
    },
    [greeting]
  );

  const quickChatStyle = useAnimatedStyle(() => {
    // Keep visible in both states, only hide when switching pages or workout detail is open
    const finalOpacity = pageProgress.value;

    return {
      opacity: finalOpacity,
      transform: [
        { translateY: 0 }, // Remove the slide animation
      ],
      pointerEvents:
        isWorkoutDetailOpen || pageProgress.value < 0.9 ? "none" : "auto",
    };
  }, [pageProgress]);

  const globalVisibilityStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isWorkoutDetailOpen ? 0 : 1, { duration: 200 }),
    pointerEvents: isWorkoutDetailOpen ? "none" : "auto",
  }));

  const handleExpand = useCallback(() => {
    if (!isExpanded) {
      setIsExpanded(true);
      fadeProgress.value = withTiming(1, { duration: 300 });
      // Ensure we're connected when expanding
      connect();
    }
  }, [isExpanded, fadeProgress, connect]);

  // Register expand function
  useEffect(() => {
    setExpandChatOverlay(handleExpand);
    return () => setExpandChatOverlay(null);
  }, [handleExpand, setExpandChatOverlay]);

  const handleCollapse = useCallback(() => {
    if (isExpanded) {
      Keyboard.dismiss();

      fadeProgress.value = withTiming(0, { duration: 300 }, (finished) => {
        if (finished) {
          scheduleOnRN(setIsExpanded, false);
        }
      });
    }
  }, [isExpanded, fadeProgress]);

  useEffect(() => {
    pageProgress.value = withTiming(isHome ? 1 : 0, { duration: 300 });
  }, [isHome, pageProgress]);

  useEffect(() => {
    if (pendingChatOpen) {
      handleExpand();
      setPendingChatOpen(false);
    }
  }, [pendingChatOpen, handleExpand, setPendingChatOpen]);

  useEffect(() => {
    if (isExpanded) {
      connect();
    } else {
      // Don't disconnect if streaming
      if (!isStreaming && loadingState !== "pending") {
        disconnect();
      }
    }
  }, [isExpanded, connect, disconnect, isStreaming, loadingState]);

  useEffect(() => {
    const onBackPress = () => {
      if (isExpanded) {
        handleCollapse();
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress
    );
    return () => subscription.remove();
  }, [isExpanded, handleCollapse]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: fadeProgress.value,
    pointerEvents: fadeProgress.value > 0.1 ? "auto" : "none",
  }));

  const backgroundColor = "rgba(0,0,0,0.9)";

  const getConnectionState = ():
    | "ready"
    | "expecting_ai_message"
    | "disconnected" => {
    if (connectionState === "disconnected") {
      return "disconnected";
    }
    if (loadingState === "pending") {
      return "expecting_ai_message";
    }
    return "ready";
  };

  return (
    <View
      style={[styles.root, { zIndex: isExpanded ? 9999 : 1 }]}
      pointerEvents="box-none"
    >
      <ResponsiveKeyboardAvoidingView
        additionalOffset={tabBarHeight}
        style={StyleSheet.absoluteFill}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[styles.expandedContent, overlayStyle, { backgroundColor }]}
          pointerEvents={isExpanded ? "auto" : "none"}
        >
          <TouchableWithoutFeedback onPress={handleCollapse}>
            <View
              style={{ flex: 1, paddingBottom: 10 }}
              onStartShouldSetResponder={() => true}
            >
              <MessageList
                messages={messages}
                streamingMessage={streamingMessage}
                showLoadingIndicator={showLoading}
                connectionState={getConnectionState()}
                statusMessage={statusMessage}
                onDismiss={handleCollapse}
                onTemplateApprove={() => {
                  handleCollapse();
                }}
              />
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>

        <YStack
          pointerEvents="box-none"
          justifyContent="flex-end"
          flex={1}
          paddingBottom={tabBarHeight - 15}
          style={styles.inputContainer}
        >
          <Animated.View style={[globalVisibilityStyle, { width: "100%" }]}>
            {!isWorkoutActive && (
              <Animated.View style={[quickChatStyle, { marginBottom: 0 }]}>
                <QuickChatActions
                  isActive={!!activeConversationId}
                  onActionSelect={handleQuickReply}
                  actions={actions}
                  isLoadingActions={isLoadingActions}
                  isWaitingForResponse={loadingState === "pending"}
                />
              </Animated.View>
            )}

            <YStack
              width="100%"
              padding="$2"
              backgroundColor="transparent"
              onLayout={(e) => setInputAreaHeight(e.nativeEvent.layout.height)}
            >
              <InputArea
                placeholder={placeholder}
                onSendMessage={sendMessage}
                isLoading={!canSend}
                disabled={!canSend}
                onFocus={handleExpand}
              />
            </YStack>
          </Animated.View>
        </YStack>
      </ResponsiveKeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
  },
  expandedContent: {
    ...StyleSheet.absoluteFillObject,
    bottom: 0,
    zIndex: 1,
  },
  inputContainer: {
    zIndex: 2,
    elevation: 2,
  },
});
