import React from "react";
import { TouchableOpacity, useColorScheme } from "react-native";
import { XStack, YStack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import { Home, User, MessageCircle, Trophy } from "@/assets/icons/IconMap";

interface Tab {
  name: string;
  title: string;
  icon: React.ComponentType<{ size: number; color: string }>;
}

const tabs: Tab[] = [
  { name: "index", title: "Home", icon: Home },
  { name: "profile", title: "Profile", icon: User },
  { name: "chats", title: "Chats", icon: MessageCircle },
  { name: "workouts", title: "Leaderboard", icon: Trophy },
];

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
    <XStack height={60} backgroundColor={backgroundColor} paddingBottom={0}>
      {tabs.map((tab, index) => {
        const isActive = activeIndex === index;
        const Icon = tab.icon;
        const color = isActive ? activeColor : inactiveColor;

        return (
          <TouchableOpacity
            key={tab.name}
            onPress={() => onTabPress(index)}
            style={{ flex: 1 }}
          >
            <YStack
              flex={1}
              justifyContent="center"
              alignItems="center"
              paddingTop="$2"
            >
              <Icon size={24} color={color} />
              <Text size="small" color={color} fontWeight="500" marginTop="$1">
                {tab.title}
              </Text>
            </YStack>
          </TouchableOpacity>
        );
      })}
    </XStack>
  );
}
