import React from "react";
import { Stack, Button, Text } from "tamagui";
import { Ionicons } from "@expo/vector-icons";

interface HeaderProps {
  greeting?: string;
  onSettingsPress?: () => void;
}

export default function Header({
  greeting = "Welcome!",
  onSettingsPress,
}: HeaderProps) {
  return (
    <Stack
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      marginBottom="$4"
    >
      <Text fontSize="$8" fontWeight="700" color="$text">
        {greeting}
      </Text>
      <Button
        size="$3"
        circular
        backgroundColor="$primary"
        onPress={onSettingsPress}
      >
        <Ionicons name="settings-outline" size={20} color="white" />
      </Button>
    </Stack>
  );
}
