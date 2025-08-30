import React from "react";
import { Stack, XStack, Text } from "tamagui";
import { Ionicons } from "@expo/vector-icons";

interface NewSetButtonProps {
  isActive: boolean;
  onPress: () => void;
}

export default function NewSetButton({ isActive, onPress }: NewSetButtonProps) {
  return (
    <Stack
      marginTop="$1.5"
      paddingVertical="$1.5"
      borderRadius="$3"
      borderWidth={1}
      borderColor={isActive ? "$borderSoft" : "$borderMuted"}
      borderStyle="dashed"
      alignItems="center"
      backgroundColor="$backgroundMuted"
      flex={0.5}
      pressStyle={
        isActive
          ? {
              backgroundColor: "$primaryTint",
              borderColor: "$primary",
            }
          : undefined
      }
      onPress={isActive ? onPress : undefined}
      cursor={isActive ? "pointer" : "default"}
    >
      <XStack gap="$1.5" alignItems="center">
        <Ionicons name="add" size={18} color="#f84f3e" />
        <Text fontSize="$4" color="$primary" fontWeight="500">
          Add Set
        </Text>
      </XStack>
    </Stack>
  );
}
