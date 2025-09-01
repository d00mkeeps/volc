import React from "react";
import { Stack, Button, Text } from "tamagui";
import { Settings } from "lucide-react";

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
      marginBottom="$3" // This stays $3 as it's the gap from header to dashboard content
    >
      <Text fontSize="$9" fontWeight="700" color="$text">
        {greeting}
      </Text>
      <Button size="$3" circular onPress={onSettingsPress}>
        <Settings size={20} color="white" />
      </Button>
    </Stack>
  );
}
