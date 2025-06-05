// app/(tabs)/profile.tsx
import React from "react";
import {
  YStack,
  XStack,
  Text,
  Card,
  ScrollView,
  Avatar,
  Separator,
} from "tamagui";
import { useUserStore } from "@/stores/userProfileStore";

export default function ProfileScreen() {
  // Get user profile from store
  const { userProfile } = useUserStore();

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Header */}
      <YStack
        padding="$4"
        backgroundColor="$backgroundStrong"
        borderBottomWidth={1}
        borderBottomColor="$borderSoft"
      >
        <Text fontSize="$7" fontWeight="bold" color="$color">
          Profile
        </Text>
        <Text fontSize="$4" color="$textMuted">
          Your account information
        </Text>
      </YStack>
    </YStack>
  );
}
