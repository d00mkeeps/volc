import React from "react";
import { Platform, KeyboardAvoidingView } from "react-native";
import { YStack, XStack } from "tamagui";
import ShimmerBox from "@/components/atoms/core/ShimmerBox";

export const ChatInterfaceSkeleton = () => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 120 : 0}
      style={{ flex: 1 }}
    >
      <YStack flex={1} position="relative">
        <YStack flex={1} />
        <XStack
          padding="$2"
          gap="$2"
          backgroundColor="$transparent"
          alignItems="flex-end"
        >
          <ShimmerBox height={44} borderRadius={12} style={{ flex: 1 }} />
          <ShimmerBox width={44} height={44} borderRadius={22} />
        </XStack>
      </YStack>
    </KeyboardAvoidingView>
  );
};
