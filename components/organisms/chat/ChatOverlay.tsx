import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Keyboard,
  StyleSheet,
  TouchableWithoutFeedback,
  BackHandler,
  View,
  TouchableOpacity,
} from "react-native";
import { YStack } from "tamagui";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
} from "react-native-reanimated";
import { useNetworkQuality } from "@/hooks/useNetworkQuality";

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
import { useColorScheme } from "react-native";
import { useUserStore } from "@/stores/userProfileStore";
import { BlurView } from "expo-blur";
import { X } from "@/assets/icons/IconMap";
import {
  CompleteWorkout,
  WorkoutExercise,
  WorkoutExerciseSet,
} from "@/types/workout";

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

  const connectionState = useChatStore((state) => state.connectionState);
  const statusMessage = useChatStore((state) => state.statusMessage);
  const connect = useChatStore((state) => state.connect);
  const disconnect = useChatStore((state) => state.disconnect);

  const sendMessage = useChatStore((state) => state.sendMessage);
  const cancelStreaming = useChatStore((state) => state.cancelStreaming);

  const { isUnreliable } = useNetworkQuality();

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

  // Computed state
  const canSend = loadingState === "idle";
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

  const quickChatStyle = useAnimatedStyle(() => {
    const finalOpacity = pageProgress.value;

    return {
      opacity: finalOpacity,
      transform: [{ translateY: 0 }],
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
      const userProfile = useUserStore.getState().userProfile;
      if (!userProfile?.user_id) return;

      const now = new Date().toISOString();
      const workoutId = `temp-${Date.now()}`;

      const workout: CompleteWorkout = {
        ...templateData,
        id: workoutId,
        user_id: userProfile.user_id.toString(),
        is_template: false,
        template_id: templateData.id,
        created_at: now,
        updated_at: now,
        workout_exercises: templateData.workout_exercises.map(
          (exercise: WorkoutExercise, index: number) => ({
            ...exercise,
            id: `exercise-${Date.now()}-${index}`,
            workout_id: workoutId,
            workout_exercise_sets: exercise.workout_exercise_sets.map(
              (set: WorkoutExerciseSet, setIndex: number) => ({
                ...set,
                id: `set-${Date.now()}-${index}-${setIndex}`,
                exercise_id: `exercise-${Date.now()}-${index}`,
                is_completed: false,
              })
            ),
          })
        ),
      };
      useUserSessionStore.getState().startWorkout(workout);
      handleCollapse();
    },
    [handleCollapse]
  );

  const handleDismiss = useCallback(() => {
    handleCollapse();
  }, [handleCollapse]);

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

  const countRef = useRef(0);
  countRef.current += 1;
  const now = new Date();
  const timestamp = `${now.getMinutes()}:${now
    .getSeconds()
    .toString()
    .padStart(2, "0")}.${now.getMilliseconds().toString().padStart(3, "0")}`;
  console.log(`[ChatOverlay] render #${countRef.current} at ${timestamp}`);

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
    colorScheme === "dark" ? "rgba(0,0,0,0.9)" : "rgba(255,255,255,0.9)";

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

          {isStreaming && (
            <Animated.View
              entering={FadeIn.duration(300)}
              style={{
                position: "absolute",
                top: 60,
                right: 20,
                zIndex: 9999,
              }}
            >
              <TouchableOpacity
                onPress={handleCollapse}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor:
                    colorScheme === "dark" ? "rgba(255,255,255)" : "rgba(0,0,0",
                }}
              >
                <BlurView
                  intensity={30}
                  tint={colorScheme === "dark" ? "dark" : "light"}
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor:
                      colorScheme === "dark"
                        ? "rgba(40,40,40,0.6)"
                        : "rgba(240,240,240,0.6)",
                  }}
                >
                  <X
                    size={20}
                    color={colorScheme === "dark" ? "#fff" : "#000"}
                  />
                </BlurView>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>

        <YStack
          pointerEvents="box-none"
          justifyContent="flex-end"
          flex={1}
          paddingBottom={tabBarHeight - 15}
          style={styles.inputContainer}
        >
          <Animated.View style={[globalVisibilityStyle, { width: "100%" }]}>
            {!isExpanded && !isWorkoutActive && (
              <Animated.View style={[quickChatStyle, { marginBottom: 0 }]}>
                <QuickChatActions
                  onActionSelect={handleQuickReply}
                  isWaitingForResponse={loadingState === "pending"}
                  isStreaming={isStreaming}
                />
              </Animated.View>
            )}

            {isExpanded && (
              <Animated.View style={[overlayStyle, { marginBottom: 0 }]}>
                <QuickChatActions
                  onActionSelect={handleQuickReply}
                  isWaitingForResponse={loadingState === "pending"}
                  isStreaming={isStreaming}
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
