import React from "react";
import { Stack, XStack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import Button from "@/components/atoms/core/Button";
import { Settings, User, Clock, Wrench } from "@/assets/icons/IconMap"; // Updated icons

interface HeaderProps {
  greeting?: string;
  onProfilePress?: () => void;
  onRecentsPress?: () => void;
  onSettingsPress?: () => void;
}

export default function Header({
  greeting = "Welcome!",
  onProfilePress,
  onRecentsPress,
  onSettingsPress,
}: HeaderProps) {
  return (
    <Stack
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      marginBottom="$3"
    >
      <Text size="large" fontWeight="700" color="$text">
        {greeting}
      </Text>
      
      <XStack gap="$2">
        <Button size="$3" circular onPress={onProfilePress} backgroundColor="$backgroundHover">
          <User size={20} color="$text" />
        </Button>
        <Button size="$3" circular onPress={onRecentsPress} backgroundColor="$backgroundHover">
          <Clock size={20} color="$text" />
        </Button>
        <Button size="$3" circular onPress={onSettingsPress} backgroundColor="$backgroundHover">
          <Wrench size={20} color="$text" />
        </Button>
      </XStack>
    </Stack>
  );
}
