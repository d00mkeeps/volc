import React, { useState, useEffect, useCallback, useRef } from "react";
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
} from "react-native-reanimated";
import { useNetworkQuality } from "@/hooks/useNetworkQuality";

import { MessageList } from "../../molecules/chat/MessageList";
import { InputArea, InputAreaRef } from "../../atoms/chat/InputArea";
import { useChatStore } from "@/stores/chat/ChatStore";
import { useConversationStore } from "@/stores/chat/ConversationStore";
import { QuickChatActions } from "@/components/molecules/home/QuickChatActions";
import { useMessageStore } from "@/stores/chat/MessageStore";
import { scheduleOnRN } from "react-native-worklets";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { ResponsiveKeyboardAvoidingView } from "@/components/atoms/core/ResponsiveKeyboardAvoidingView";
import { useLayoutStore } from "@/stores/layoutStore";
import { useColorScheme } from "react-native";

interface ChatOverlayProps {
  currentPage?: number;
}

export const ChatOverlay = ({ currentPage = 0 }: ChatOverlayProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // ChatStore selectors
  const loadingState = useChatStore((state) => state.loadingState);
  const greeting = useChatStore((state) => state.greeting);
  const placeholder = useChatStore((state) => state.placeholder);
  const inputAreaRef = useRef<InputAreaRef>(null);

  const failedMessageContent = useChatStore(
    (state) => state.failedMessageContent
  );
  const setFailedMessageContent = useChatStore(
    (state) => state.setFailedMessageContent
  );

  const connectionState = useChatStore((state) => state.connectionState);
  const statusMessage = useChatStore((state) => state.statusMessage);
  const connect = useChatStore((state) => state.connect);
  const disconnect = useChatStore((state) => state.disconnect);
  const { health, isUnreliable } = useNetworkQuality();
  const sendMessage = useChatStore((state) => state.sendMessage);
  const cancelStreaming = useChatStore((state) => state.cancelStreaming);

  useEffect(() => {
    if (failedMessageContent && inputAreaRef.current) {
      inputAreaRef.current.setText(failedMessageContent);
      setFailedMessageContent(null);
    }
  }, [failedMessageContent, setFailedMessageContent]);

  const handleSendMessage = useCallback(
    (content: string) => {
      sendMessage(content, () => health);
    },
    [sendMessage, health]
  );

  // Network-based auto-cancel
  useEffect(() => {
    const isActuallyStreaming = loadingState === "streaming";

    if (isActuallyStreaming && isUnreliable) {
      console.log("[ChatOverlay] Auto-cancelling due to poor network");
      cancelStreaming("network_failure");
    }
  }, [loadingState, isUnreliable, cancelStreaming]);

  const colorScheme = useColorScheme();
  const tabBarHeight = useLayoutStore((state) => state.tabBarHeight);
  const setExpandChatOverlay = useLayoutStore(
    (state) => state.setExpandChatOverlay
  );
  const setInputAreaHeight = useLayoutStore(
    (state) => state.setInputAreaHeight
  );

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

  // Computed state
  const showLoading = loadingState === "pending";
  const isStreaming = loadingState === "streaming";

  const handleQuickReply = useCallback(
    (text: string) => {
      if (isExpanded && connectionState !== "disconnected") {
        sendMessage(text);
      } else {
        const activeId = useConversationStore.getState().activeConversationId;
        if (!activeId) {
          useConversationStore.getState().setPendingGreeting(greeting);
        }
        useConversationStore.getState().setPendingInitialMessage(text);
        useConversationStore.getState().setPendingChatOpen(true);
      }
    },
    [isExpanded, connectionState, sendMessage, greeting]
  );

  /*
   * VISIBILITY EXPLANATION:
   *
   * 1. Quick Chat Actions:
   *    - Hide if workout is active (isWorkoutActive)
   *    - Hide if workout detail sheet is open (isWorkoutDetailOpen)
   *    - Hide if not on home page (pageProgress < 0.9)
   *
   * 2. Global Overlay (Input Bar):
   *    - HIDE ONLY if workout detail sheet is open (isWorkoutDetailOpen covers full screen context)
   *    - SHOW if workout is ACTIVE (isWorkoutActive)
   */

  // /components/organisms/chat/ChatOverlay.tsx

  // /components/organisms/chat/ChatOverlay.tsx
  // /components/organisms/chat/ChatOverlay.tsx

  // /components/organisms/chat/ChatOverlay.tsx

  const quickChatStyle = useAnimatedStyle(() => {
    const shouldHide =
      fadeProgress.value < 0.5 && // Use fadeProgress instead of isExpanded
      (isWorkoutDetailOpen || pageProgress.value < 0.9 || isWorkoutActive);

    return {
      opacity: withTiming(shouldHide ? 0 : pageProgress.value, {
        duration: 200,
      }),
      transform: [{ translateY: 0 }],
      pointerEvents: shouldHide ? "none" : "auto",
    };
  }, [pageProgress, isWorkoutDetailOpen, isWorkoutActive, fadeProgress]);

  const globalVisibilityStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isWorkoutDetailOpen ? 0 : 1, { duration: 200 }),
    pointerEvents: isWorkoutDetailOpen ? "none" : "auto",
  }));

  const handleExpand = useCallback(() => {
    if (!isExpanded) {
      setIsExpanded(true);
      fadeProgress.value = withTiming(1, { duration: 300 });
      connect();
    }
  }, [isExpanded, fadeProgress, connect]);

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

  const handleTemplateApprove = useCallback(
    (templateData: any) => {
      handleCollapse();

      // Start workout after collapse animation completes
      setTimeout(() => {
        useUserSessionStore.getState().startWorkout(templateData);
      }, 350);
    },
    [handleCollapse]
  );

  const handleDismiss = useCallback(() => {
    handleCollapse();
  }, [handleCollapse]);

  useEffect(() => {
    const interval = setInterval(() => {
      useConversationStore.getState().checkTimeout();
    }, 60000); // Check every 60 seconds

    return () => clearInterval(interval);
  }, []);

  // Register expand function
  useEffect(() => {
    setExpandChatOverlay(handleExpand);
    return () => setExpandChatOverlay(null);
  }, [handleExpand, setExpandChatOverlay]);

  useEffect(() => {
    pageProgress.value = withTiming(isHome ? 1 : 0, { duration: 300 });
  }, [isHome, pageProgress]);

  useEffect(() => {
    if (pendingChatOpen) {
      handleExpand();
      setPendingChatOpen(false);
    }
  }, [pendingChatOpen, handleExpand, setPendingChatOpen]);

  // const countRef = useRef(0);
  // countRef.current += 1;
  // const now = new Date();
  // const timestamp = `${now.getMinutes()}:${now
  //   .getSeconds()
  //   .toString()
  //   .padStart(2, "0")}.${now.getMilliseconds().toString().padStart(3, "0")}`;
  // console.log(`[ChatOverlay] render #${countRef.current} at ${timestamp}`);

  useEffect(() => {
    if (isExpanded) {
      connect();
    } else {
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

  const backgroundColor =
    colorScheme === "dark" ? "rgba(0, 0, 0, .95)" : "rgba(255,255,255,.95)";

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
          {isExpanded ? (
            <View style={{ flex: 1 }}>
              <TouchableWithoutFeedback onPress={handleDismiss}>
                <View
                  style={{ flex: 1, paddingBottom: 10 }}
                  onStartShouldSetResponder={() => true}
                >
                  <MessageList
                    messages={messages}
                    showLoadingIndicator={showLoading}
                    connectionState={getConnectionState()}
                    statusMessage={statusMessage}
                    onDismiss={handleDismiss}
                    onTemplateApprove={handleTemplateApprove}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          ) : null}
        </Animated.View>

        <YStack
          pointerEvents="box-none"
          justifyContent="flex-end"
          flex={1}
          paddingBottom={tabBarHeight - 15}
          style={styles.inputContainer}
        >
          <Animated.View style={[globalVisibilityStyle, { width: "100%" }]}>
            <Animated.View style={[quickChatStyle, { marginBottom: 0 }]}>
              <QuickChatActions
                onActionSelect={handleQuickReply}
                isWaitingForResponse={loadingState === "pending"}
                isStreaming={isStreaming}
              />
            </Animated.View>

            <YStack
              width="100%"
              padding="$2"
              backgroundColor="transparent"
              onLayout={(e) => setInputAreaHeight(e.nativeEvent.layout.height)}
            >
              <InputArea
                ref={inputAreaRef}
                placeholder={placeholder || "ask me anything"}
                onSendMessage={handleSendMessage}
                isStreaming={isStreaming}
                onFocus={handleExpand}
                onCancel={() => cancelStreaming("user_requested")}
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
    paddingBottom: 16,
  },
  expandedContent: {
    ...StyleSheet.absoluteFillObject,
    bottom: 0,
    zIndex: 1,
  },
  inputContainer: {
    zIndex: 2,
    elevation: 2,
    paddingBottom: 24,
  },
});
