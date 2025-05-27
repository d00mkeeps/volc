import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Button, Stack, Text } from "tamagui";

interface ActionButtonProps {
  icon?: string;
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
      width="60%"
      height={60}
      alignSelf="center"
      backgroundColor="$primary"
      borderRadius="$4"
      pressStyle={{ backgroundColor: "$primaryLight" }}
      onPress={onPress}
    >
      <Stack
        alignItems="center"
        justifyContent="center"
        gap={icon ? "$1" : 0}
        flex={1}
      >
        {icon && <Ionicons name={icon as any} size={20} color="white" />}
        <Text color="white" fontSize="$9" fontWeight="700" textAlign="center">
          {label}
        </Text>
      </Stack>
    </Button>
  );
}
