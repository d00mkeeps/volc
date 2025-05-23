import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Button, Stack, Text } from "tamagui";

interface ActionButtonProps {
  icon: string;
  label: string;
  onPress: () => void;
}

export default function ActionButton({
  icon,
  label,
  onPress,
}: ActionButtonProps) {
  return (
    <Button
      flex={1}
      backgroundColor="$primary"
      borderRadius="$4"
      pressStyle={{ backgroundColor: "$primaryLight" }}
      onPress={onPress}
    >
      <Stack alignItems="center" gap="$1">
        <Ionicons name={icon as any} size={20} color="white" />
        <Text color="white" fontSize="$2" fontWeight="500" textAlign="center">
          {label}
        </Text>
      </Stack>
    </Button>
  );
}
