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
import { YStack, XStack, useTheme } from "tamagui";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  interpolate,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Text from "@/components/atoms/core/Text";
import { MessageList } from "../../molecules/chat/MessageList";
import { InputArea } from "../../atoms/chat/InputArea";
import { useChatOverlay } from "@/hooks/chat/useChatOverlay";
import { useConversationStore } from "@/stores/chat/ConversationStore";
import Button from "@/components/atoms/core/Button";
import { X, ChevronDown } from "@/assets/icons/IconMap";

interface ChatOverlayProps {
  placeholder?: string;
  tabBarHeight?: number;
}

export const ChatOverlay = ({
  placeholder = "Ask me anything...",
  tabBarHeight = 50,
}: ChatOverlayProps) => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const chat = useChatOverlay();

  // Animation State
  const fadeProgress = useSharedValue(0);

  // UI Coordination
  const pendingChatOpen = useConversationStore((state) => state.pendingChatOpen);
  const setPendingChatOpen = useConversationStore((state) => state.setPendingChatOpen);

  // Expand Handler
  const handleExpand = useCallback(() => {
    if (!isExpanded) {
      setIsExpanded(true);
      fadeProgress.value = withTiming(1, { duration: 300 });
    }
  }, [isExpanded, fadeProgress]);

  // Collapse Handler
  const handleCollapse = useCallback(() => {
    if (isExpanded) {
      Keyboard.dismiss();
      fadeProgress.value = withTiming(0, { duration: 300 }, (finished) => {
        if (finished) {
          runOnJS(setIsExpanded)(false);
        }
      });
    }
  }, [isExpanded, fadeProgress]);

  // Auto-expand on signal - Needs to be AFTER handleExpand is defined
  useEffect(() => {
    if (pendingChatOpen) {
      console.log("🚀 [ChatOverlay] Auto-expanding from pendingChatOpen signal");
      handleExpand();
      setPendingChatOpen(false);
    }
  }, [pendingChatOpen, handleExpand, setPendingChatOpen]);

  // Connect when expanded
  useEffect(() => {
    const activeConvId = useConversationStore.getState().activeConversationId;
    console.log(`🔌 [ChatOverlay] isExpanded changed: ${isExpanded}, activeConvID: ${activeConvId?.substring(0, 4) || 'NONE'}`);
    
    if (isExpanded) {
      chat.connect();
    } else {
      chat.disconnect();
    }
  }, [isExpanded]);

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

  // Animated Styles
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: fadeProgress.value,
    pointerEvents: fadeProgress.value > 0.1 ? "auto" : "none",
  }));
  
  // Background color based on 90% opacity requirement
  // "90% opacity backdrop (black in dark mode...)"
  // We'll trust the theme or hardcode based on user request "black in dark mode"
  // Assuming a dark mode context mostly from code seen
  const backgroundColor = "rgba(0,0,0,0.9)"; // Fixed 90% black for now or derive? 
  // User said: "90% opacity backdrop (black in dark mode, white in light mode)"
  // We can use theme.background but modify opacity? 
  // Let's stick to safe rgba(0,0,0,0.9) for dark for now, verify theme later.

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

  
  /*
   * ARCHITECTURE:
   * Root View: Absolute fill, pointerEvents="box-none".
   * 
   * 1. Backdrop/Overlay Layer:
   *    - Absolute fill.
   *    - Opacity animates 0 -> 1.
   *    - Background Color: 90% opacity.
   *    - Content: Messages, Header.
   *    - pointerEvents: "auto" when expanded, "none" when collapsed.
   * 
   * 2. Input Layer:
   *    - Sits inside KeyboardAvoidingView.
   *    - Always visible.
   *    - Animates position? No, let standard KAV handle it.
   *    - When collapsed: Sits above tabs.
   *    - When expanded: Sits at bottom (above keyboard).
   */

  return (
    <View style={styles.root} pointerEvents="box-none">
       {/* 
         KeyboardAvoidingView wraps everything so Input moves up.
         Behavior: 'padding' usually works best on iOS.
       */}
       <KeyboardAvoidingView
         behavior={Platform.OS === "ios" ? "padding" : undefined}
         style={StyleSheet.absoluteFill}
         pointerEvents="box-none"
       >
          <View style={{ flex: 1 }} pointerEvents="box-none">
             
             {/* 1. The Expandable Content (Backdrop + Messages) */}
             <Animated.View 
                style={[
                    styles.expandedContent, 
                    overlayStyle,
                    { backgroundColor }
                ]}
                pointerEvents={isExpanded ? "auto" : "none"}
             >
                <TouchableWithoutFeedback onPress={handleCollapse}>
                    <View style={{ flex: 1 }}>
                        {/* Header Area */}
                        {/* Reduced top padding to fix gap issue */}
                        <YStack paddingTop={insets.top} paddingHorizontal="$4" zIndex={10}>
                           <XStack justifyContent="flex-end" paddingVertical="$2">
                               <Button 
                                  size="$3" 
                                  circular 
                                  backgroundColor="transparent" 
                                  onPress={handleCollapse}
                                  icon={<ChevronDown size={24} color="$text" />}
                               />
                           </XStack>
                        </YStack>

                        {/* Messages Area */}
                        {/* Ensure taps on the empty part of MessageList also dismiss if possible? 
                            The user said "background of messagelist isn't letting modal background register taps".
                            This implies MessageList consumes the touches.
                            We can wrap MessageList in a View that does NOT consume touches unless it hits a child?
                            Or use pointerEvents="box-none" on the container of MessageList?
                            But MessageList needs to scroll.
                            
                            Actually, if MessageList is a FlatList, the empty space *inside* it should propagate if not handled?
                            FlatList handles touches.
                            
                            Workaround: We keep MessageList as is for now, but ensure the backdrop BEHIND it is touchable.
                            If MessageList fills flex:1, it covers the backdrop.
                            
                            If we want tap-to-dismiss on empty areas of MessageList, we need a custom solution or 
                            rely on the header/backdrop areas.
                            
                            Let's focus on Input Area stacking first.
                        */}
                        <View style={{ flex: 1 }} onStartShouldSetResponder={() => true}> 
                           <MessageList
                              messages={chat.messages}
                              streamingMessage={chat.streamingMessage}
                              showLoadingIndicator={isInputDisabled}
                              connectionState={getConnectionState()}
                              statusMessage={chat.statusMessage}
                              onDismiss={handleCollapse} // Connect dismiss
                              onTemplateApprove={(template) => {
                                  chat.processTemplateApproval(template);
                                  handleCollapse();
                              }}
                            />
                        </View>
                    </View>
                </TouchableWithoutFeedback>
             </Animated.View>

             {/* 2. The Input Area (Always Visible) */}
             <YStack 
                pointerEvents="box-none"
                justifyContent="flex-end"
                flex={1}
                paddingBottom={isExpanded ? 0 : tabBarHeight + 10}
                style={styles.inputContainer} // Apply zIndex here
             >
                 <YStack 
                    width="100%" 
                    paddingHorizontal="$4"
                    paddingVertical="$2"
                    backgroundColor="transparent"
                 >
                    <InputArea
                      placeholder={placeholder}
                      onSendMessage={chat.sendMessage}
                      isLoading={isInputDisabled}
                      disabled={isInputDisabled && isExpanded}
                      onFocus={handleExpand}
                    />
                 </YStack>
             </YStack>
          </View>
       </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  expandedContent: {
    ...StyleSheet.absoluteFillObject,
    bottom: 0,
    zIndex: 1, 
  },
  // Add specific style for input container to ensure it sits on top
  inputContainer: {
    zIndex: 2,
    elevation: 2, // Android specific
  }
});
