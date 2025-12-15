import React from "react";
import { Stack, XStack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import Button from "@/components/atoms/core/Button";
import {
  Settings,
  User,
  Clock,
  Wrench,
  Pencil,
  NetworkStatusIcon,
} from "@/assets/icons/IconMap"; // Updated icons
import { useLayoutStore } from "@/stores/layoutStore";
import { useNetworkQuality } from "@/hooks/useNetworkQuality";

interface HeaderProps {
  greeting?: string;
  onProfilePress?: () => void;
  onRecentsPress?: () => void;
  onSettingsPress?: () => void;
  onManualLogPress?: () => void;
}

export default function Header({
  greeting = "Welcome!",
  onProfilePress,
  onRecentsPress,
  onSettingsPress,
  onManualLogPress,
}: HeaderProps) {
  const setHeaderHeight = useLayoutStore((state) => state.setHeaderHeight);
  const { quality, isHealthy } = useNetworkQuality();

  return (
    <Stack
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      marginBottom="$3"
      onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
    >
      <Text size="large" fontWeight="700" color="$text">
        {greeting}
      </Text>
      <XStack gap="$2">
        {/* Network Status - only show if not healthy */}
        {!isHealthy && (
          <Stack
            justifyContent="center"
            alignItems="center"
            paddingHorizontal="$2"
          >
            <NetworkStatusIcon quality={quality} size={20} color="$text" />
          </Stack>
        )}
        <Button
          size="$3"
          circular
          onPress={onManualLogPress}
          backgroundColor="$backgroundHover"
        >
          <Pencil size={20} color="$text" />
        </Button>
        <Button
          size="$3"
          circular
          onPress={onProfilePress}
          backgroundColor="$backgroundHover"
        >
          <User size={20} color="$text" />
        </Button>
        <Button
          size="$3"
          circular
          onPress={onRecentsPress}
          backgroundColor="$backgroundHover"
        >
          <Clock size={20} color="$text" />
        </Button>
        <Button
          size="$3"
          circular
          onPress={onSettingsPress}
          backgroundColor="$backgroundHover"
        >
          <Wrench size={20} color="$text" />
        </Button>
      </XStack>
    </Stack>
  );
}
