import React from "react";
import { TouchableOpacity, useColorScheme } from "react-native";
import { XStack, YStack } from "tamagui";
import { BlurView } from "expo-blur";
import { AppIcon } from "@/assets/icons/IconMap";

interface __CustomTabBarProps__ {
  activeIndex: number;
  onTabPress: (index: number) => void;
  onLayout?: (height: number) => void;
}

export default function CustomTabBar({
  activeIndex,
  onTabPress,
  onLayout,
}: __CustomTabBarProps__) {
  const colorScheme = useColorScheme();
  const activeColor = "#f84f3e";
  const inactiveColor = colorScheme === "dark" ? "#6b6466" : "#999999";

  return (
    <YStack
      position="absolute"
      bottom={0}
      left={0}
      right={0}
      onLayout={(e) => onLayout?.(e.nativeEvent.layout.height)}
      overflow="hidden"
    >
      <BlurView intensity={80} tint={colorScheme === "dark" ? "dark" : "light"}>
        {/* Tabs Row */}
        <XStack justifyContent="space-around" alignItems="center" height={24}>
          {/* Home Tab */}
          <TouchableOpacity
            onPress={() => onTabPress(0)}
            style={{ padding: 8 }}
          >
            <YStack alignItems="center" justifyContent="center">
              <AppIcon
                name="Home"
                size={24}
                color={activeIndex === 0 ? activeColor : inactiveColor}
              />
            </YStack>
          </TouchableOpacity>

          {/* Leaderboard Tab */}
          <TouchableOpacity
            onPress={() => onTabPress(1)}
            style={{ padding: 8 }}
          >
            <YStack alignItems="center" justifyContent="center">
              <AppIcon
                name="Trophy"
                size={24}
                color={activeIndex === 1 ? activeColor : inactiveColor}
              />
            </YStack>
          </TouchableOpacity>
        </XStack>
      </BlurView>
    </YStack>
  );
}
