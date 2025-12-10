import React from "react";
import { TouchableOpacity, useColorScheme } from "react-native";
import { XStack, YStack } from "tamagui";
import { Home, Trophy } from "@/assets/icons/IconMap";

interface Tab {
  name: string;
  title: string;
  icon: React.ComponentType<{ size: number; color: string }>;
}


interface CustomTabBarProps {
  activeIndex: number;
  onTabPress: (index: number) => void;
}

export default function CustomTabBar({
  activeIndex,
  onTabPress,
}: CustomTabBarProps) {
  const colorScheme = useColorScheme();

  const backgroundColor = colorScheme === "dark" ? "#231f20" : "#ffffff";
  const activeColor = "#f84f3e";
  const inactiveColor = colorScheme === "dark" ? "#6b6466" : "#999999";

  return (
    <YStack
      backgroundColor={backgroundColor}     
   >
      {/* Tabs Row */}
      <XStack justifyContent="space-around" alignItems="center">
        {/* Home Tab */}
        <TouchableOpacity onPress={() => onTabPress(0)} style={{ padding: 8 }}>
          <YStack alignItems="center" justifyContent="center">
            <Home
              size={24}
              color={activeIndex === 0 ? activeColor : inactiveColor}
            />
          </YStack>
        </TouchableOpacity>

        {/* Leaderboard Tab */}
        <TouchableOpacity onPress={() => onTabPress(1)} style={{ padding: 8 }}>
          <YStack alignItems="center" justifyContent="center">
            <Trophy
              size={24}
              color={activeIndex === 1 ? activeColor : inactiveColor}
            />
          </YStack>
        </TouchableOpacity>
      </XStack>
    </YStack>
  );
}