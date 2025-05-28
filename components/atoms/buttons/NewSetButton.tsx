// atoms/buttons/NewSetButton.tsx
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
      backgroundColor="transparent"
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
        <Ionicons
          name="add"
          size={18}
          color={isActive ? "$primary" : "$textMuted"}
        />
        <Text
          fontSize="$3"
          color={isActive ? "$primary" : "$textMuted"}
          fontWeight="500"
        >
          Add Set
        </Text>
      </XStack>
    </Stack>
  );
}
