import React from "react";
import { Stack, XStack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import { Plus } from "@/assets/icons/IconMap";
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
        <Plus size={18} color="#f84f3e" />
        <Text size="medium" color="$primary" fontWeight="500">
          Add Set
        </Text>
      </XStack>
    </Stack>
  );
}
