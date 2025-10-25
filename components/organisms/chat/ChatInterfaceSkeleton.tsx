import React, { useEffect, useRef } from "react";
import { Platform, KeyboardAvoidingView, Animated } from "react-native";
import { YStack, XStack } from "tamagui";

export const ChatInterfaceSkeleton = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();

    return () => shimmer.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 120 : 0}
      style={{ flex: 1 }}
    >
      <YStack flex={1} position="relative">
        {/* Empty message area */}
        <YStack flex={1} />

        {/* Skeleton Input Area */}
        <XStack
          padding="$2"
          gap="$2"
          backgroundColor="$transparent"
          alignItems="flex-end"
        >
          <Animated.View
            style={{
              flex: 1,
              height: 44,
              borderRadius: 12,
              backgroundColor: "$borderSoft",
              opacity,
            }}
          />
          <Animated.View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: "$borderSoft",
              opacity,
            }}
          />
        </XStack>
      </YStack>
    </KeyboardAvoidingView>
  );
};
