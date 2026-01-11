import React from "react";
import { TouchableOpacity, useColorScheme } from "react-native";
import { XStack, YStack } from "tamagui";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { AppIcon } from "@/assets/icons/IconMap";

interface CustomTabBarProps {
  activeIndex: number;
  onTabPress: (index: number) => void;
  onLayout?: (height: number) => void;
}

export default function CustomTabBar({
  activeIndex,
  onTabPress,
  onLayout,
}: CustomTabBarProps) {
  const colorScheme = useColorScheme();
  const activeColor = "#f84f3e";
  const inactiveColor = colorScheme === "dark" ? "#6b6466" : "#999999";

  // Total blur gradient height - extends upward
  const BLUR_GRADIENT_HEIGHT = 100;
  // Actual tab bar height (for layout measurement)
  const TAB_BAR_HEIGHT = 32;

  return (
    <YStack
      position="absolute"
      bottom={0}
      left={0}
      right={0}
      height={BLUR_GRADIENT_HEIGHT}
      pointerEvents="box-none"
    >
      {/* Blur Gradient Background */}
      <MaskedView
        style={{ flex: 1 }}
        maskElement={
          <LinearGradient
            colors={["transparent", "black"]}
            locations={[0, 0.5]}
            style={{ flex: 1 }}
          />
        }
      >
        <BlurView
          intensity={80}
          tint={colorScheme === "dark" ? "dark" : "light"}
          style={{ flex: 1 }}
        />
      </MaskedView>

      {/* Tab Bar Content */}
      <XStack
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        height={TAB_BAR_HEIGHT}
        justifyContent="space-around"
        alignItems="center"
        onLayout={(e) => onLayout?.(e.nativeEvent.layout.height)}
        pointerEvents="auto"
      >
        {/* Home Tab */}
        <TouchableOpacity onPress={() => onTabPress(0)}>
          <YStack alignItems="center" justifyContent="center">
            <AppIcon
              name="Home"
              size={24}
              color={activeIndex === 0 ? activeColor : inactiveColor}
            />
          </YStack>
        </TouchableOpacity>

        {/* Leaderboard Tab */}
        <TouchableOpacity onPress={() => onTabPress(1)}>
          <YStack alignItems="center" justifyContent="center">
            <AppIcon
              name="Trophy"
              size={24}
              color={activeIndex === 1 ? activeColor : inactiveColor}
            />
          </YStack>
        </TouchableOpacity>
      </XStack>
    </YStack>
  );
}
