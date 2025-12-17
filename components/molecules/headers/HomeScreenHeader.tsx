import React from "react";
import { Stack, XStack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import Button from "@/components/atoms/core/Button";
import { AppIcon } from "@/assets/icons/IconMap";
import { useLayoutStore } from "@/stores/layoutStore";
import { useNetworkQuality } from "@/hooks/useNetworkQuality";
import { HomeScreenHeaderMenu } from "./HomeScreenHeaderMenu";

interface HeaderProps {
  greeting?: string;
  onProfilePress?: () => void;
  onRecentsPress?: () => void;
  onSettingsPress?: () => void;
  onNewChat?: () => void;
  onNewWorkout?: () => void;
}

export default function Header({
  greeting = "Welcome!",
  onProfilePress,
  onRecentsPress,
  onSettingsPress,
  onNewChat,
  onNewWorkout,
}: HeaderProps) {
  const setHeaderHeight = useLayoutStore((state) => state.setHeaderHeight);
  const { health, isUnreliable } = useNetworkQuality();

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
        {isUnreliable && (
          <Stack
            justifyContent="center"
            alignItems="center"
            paddingHorizontal="$2"
          >
            <AppIcon
              name={
                health === "excellent"
                  ? "NetworkExcellent"
                  : health === "good"
                  ? "NetworkGood"
                  : health === "poor"
                  ? "NetworkPoor"
                  : "NetworkOffline"
              }
              size={20}
              color="$text"
            />
          </Stack>
        )}

        {onNewChat && onNewWorkout && (
          <HomeScreenHeaderMenu
            onNewChat={onNewChat}
            onNewWorkout={onNewWorkout}
          />
        )}

        <Button
          size="$3"
          circular
          onPress={onProfilePress}
          backgroundColor="$backgroundHover"
        >
          <AppIcon name="User" size={20} color="$text" />
        </Button>
        <Button
          size="$3"
          circular
          onPress={onRecentsPress}
          backgroundColor="$backgroundHover"
        >
          <AppIcon name="Clock" size={20} color="$text" />
        </Button>
        <Button
          size="$3"
          circular
          onPress={onSettingsPress}
          backgroundColor="$backgroundHover"
        >
          <AppIcon name="Wrench" size={20} color="$text" />
        </Button>
      </XStack>
    </Stack>
  );
}
