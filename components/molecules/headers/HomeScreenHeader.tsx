import React from "react";
import { Stack } from "tamagui";
import Text from "@/components/atoms/Text";
import Button from "@/components/atoms/Button";
import { Settings } from "@/assets/icons/IconMap";
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
      <Text size="medium" fontWeight="700" color="$text">
        {greeting}
      </Text>
      <Button size="$3" circular onPress={onSettingsPress}>
        <Settings size={20} color="white" />
      </Button>
    </Stack>
  );
}
