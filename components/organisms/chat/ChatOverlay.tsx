import React, { useState, useEffect, useCallback } from "react";
import {
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  StyleSheet,
  TouchableWithoutFeedback,
  BackHandler,
  View,
} from "react-native";
import { YStack, useTheme } from "tamagui";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MessageList } from "../../molecules/chat/MessageList";
import { InputArea } from "../../atoms/chat/InputArea";
import { useChatOverlay } from "@/hooks/chat/useChatOverlay";
import { useConversationStore } from "@/stores/chat/ConversationStore";
import { QuickChatActions } from "@/components/molecules/home/QuickChatActions";
import { useFreshGreeting } from "@/hooks/chat/useFreshGreeting";
import { useMessageStore } from "@/stores/chat/MessageStore";
import { scheduleOnRN } from "react-native-worklets";
import { useUserSessionStore } from "@/stores/userSessionStore";

interface ChatOverlayProps {
  placeholder?: string;
  tabBarHeight?: number;
  keyboardVerticalOffset?: number;
  currentPage?: number; // Add this
}

export const ChatOverlay = ({
  placeholder = "Ask me anything...",
  tabBarHeight = 50,
  currentPage = 0, // Add this
  keyboardVerticalOffset = 70,
}: ChatOverlayProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const chat = useChatOverlay();

  // Animation State
  const fadeProgress = useSharedValue(0);

  // UI Coordination
  const pendingChatOpen = useConversationStore(
    (state) => state.pendingChatOpen
  );
  const setPendingChatOpen = useConversationStore(
    (state) => state.setPendingChatOpen
  );
  const isWorkoutActive = useUserSessionStore((state) => state.isActive);
  const isWorkoutDetailOpen = useUserSessionStore(
    (state) => state.isWorkoutDetailOpen
  ); // NEW Sub

  // Quick Chat State Integration
  const isHome = currentPage === 0;
  const pageProgress = useSharedValue(isHome ? 1 : 0);
  const activeConversationId = useConversationStore(
    (state) => state.activeConversationId
  );
  const freshGreeting = useFreshGreeting();

  const recentMessages = useMessageStore((state) =>
    activeConversationId ? state.messages.get(activeConversationId) : undefined
  );

  const handleQuickReply = useCallback(
    (text: string) => {
      const activeId = useConversationStore.getState().activeConversationId;

      // Only set greeting for NEW conversations
      if (!activeId) {
        useConversationStore.getState().setPendingGreeting(freshGreeting);
      }

      // Set pending message and open overlay
      useConversationStore.getState().setPendingInitialMessage(text);
      useConversationStore.getState().setPendingChatOpen(true);
    },
    [freshGreeting]
  );

  const quickChatStyle = useAnimatedStyle(() => {
    const finalOpacity =
      interpolate(fadeProgress.value, [0, 0.5], [1, 0]) * pageProgress.value;
    console.log(
      "👁️ QuickChat opacity:",
      finalOpacity,
      "page:",
      pageProgress.value
    );

    return {
      opacity: finalOpacity,
      transform: [
        { translateY: interpolate(fadeProgress.value, [0, 1], [0, 20]) },
      ],
      pointerEvents:
        fadeProgress.value > 0.1 ||
        isWorkoutDetailOpen ||
        pageProgress.value < 0.9
          ? "none"
          : "auto",
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
    }
  }, [isExpanded, fadeProgress]);

  const handleCollapse = useCallback(() => {
    if (isExpanded) {
      Keyboard.dismiss();

      const refreshActions = () => {
        if (useConversationStore.getState().activeConversationId) {
          useConversationStore.getState().fetchSuggestedActions();
        }
      };

      fadeProgress.value = withTiming(0, { duration: 300 }, (finished) => {
        if (finished) {
          scheduleOnRN(setIsExpanded, false);
          scheduleOnRN(refreshActions);
        }
      });
    }
  }, [isExpanded, fadeProgress]);

  useEffect(() => {
    console.log(
      "🎨 [ChatOverlay] Page animation - isHome:",
      isHome,
      "target:",
      isHome ? 1 : 0
    );
    pageProgress.value = withTiming(isHome ? 1 : 0, { duration: 300 });
  }, [isHome]);
  useEffect(() => {
    if (pendingChatOpen) {
      handleExpand();
      setPendingChatOpen(false);
    }
  }, [pendingChatOpen, handleExpand, setPendingChatOpen]);

  useEffect(() => {
    if (isExpanded) {
      chat.connect();
    } else {
      chat.disconnect();
    }
  }, [isExpanded, chat.connect, chat.disconnect]);

  // Back handler
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
    if (chat.connectionState === "disconnected") {
      return "disconnected";
    }
    if (chat.messages.length === 0 && !chat.streamingMessage) {
      return "expecting_ai_message";
    }
    return "ready";
  };

  const isInputDisabled =
    getConnectionState() === "expecting_ai_message" ||
    (!!chat.streamingMessage && !chat.streamingMessage.isComplete);

  return (
    <View
      style={[styles.root, { zIndex: isExpanded ? 9999 : 100 }]}
      pointerEvents="box-none"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={StyleSheet.absoluteFill}
        pointerEvents="box-none"
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <Animated.View
          style={[styles.expandedContent, overlayStyle, { backgroundColor }]}
          pointerEvents={isExpanded ? "auto" : "none"}
        >
          <TouchableWithoutFeedback onPress={handleCollapse}>
            <View
              style={{ flex: 1, paddingBottom: 80 }}
              onStartShouldSetResponder={() => true}
            >
              <MessageList
                messages={chat.messages}
                streamingMessage={chat.streamingMessage}
                showLoadingIndicator={isInputDisabled}
                connectionState={getConnectionState()}
                statusMessage={chat.statusMessage}
                onDismiss={handleCollapse}
                onTemplateApprove={(template) => {
                  chat.processTemplateApproval(template);
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
                  recentMessages={recentMessages || undefined}
                  greeting={freshGreeting}
                  onMessagePress={handleExpand}
                  showPreview={isHome}
                />
              </Animated.View>
            )}

            <YStack width="100%" padding="$2" backgroundColor="transparent">
              <InputArea
                placeholder={placeholder}
                onSendMessage={chat.sendMessage}
                isLoading={isInputDisabled}
                disabled={isInputDisabled && isExpanded}
                onFocus={handleExpand}
              />
            </YStack>
          </Animated.View>
        </YStack>
      </KeyboardAvoidingView>
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
