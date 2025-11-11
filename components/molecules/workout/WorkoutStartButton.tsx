import React, { useState } from "react";
import { YStack, Stack, useTheme } from "tamagui";
import { Pressable, useColorScheme } from "react-native";
import Animated, {
  FadeInDown,
  FadeOutUp,
  Layout,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import Text from "@/components/atoms/core/Text";
import Button from "@/components/atoms/core/Button";
import { ChevronUp } from "@/assets/icons/IconMap";

interface __WorkoutStartButtonProps__ {
  onPlanWithCoach: () => void;
  onLogManually: () => void;
}

export const WorkoutStartButton = ({
  onPlanWithCoach,
  onLogManually,
}: __WorkoutStartButtonProps__) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const theme = useTheme();
  const colorScheme = useColorScheme();

  const iconColor = colorScheme === "dark" ? "#ffffff" : "#231f20";

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <YStack width="60%" gap="$3" alignSelf="center">
      {/* Primary button - always visible */}
      <Button
        onPress={isExpanded ? onPlanWithCoach : handleToggle}
        width="100%"
        height="$6"
        backgroundColor="$primary"
        pressStyle={{ backgroundColor: "$primaryPress" }}
        shadowColor="$primary"
        shadowOffset={{ width: 0, height: 8 }}
        shadowOpacity={0.35}
        shadowRadius={24}
        elevation={8}
      >
        <LinearGradient
          colors={[
            theme.primary?.val || "#FF6B5A",
            theme.primaryPress?.val || "#FF4A3D",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            borderRadius: 12,
          }}
        />
        <Text color="white" size="large" fontWeight="600">
          {isExpanded ? "Plan with Coach" : "Start Workout"}
        </Text>
      </Button>

      {/* Animated secondary options */}
      {isExpanded && (
        <>
          {/* Ghost secondary button */}
          <Animated.View
            entering={FadeInDown.duration(250).springify()}
            exiting={FadeOutUp.duration(200)}
            layout={Layout.springify()}
          >
            <Button
              onPress={onLogManually}
              backgroundColor="transparent"
              height="$6"
              width="100%"
              pressStyle={{
                backgroundColor:
                  colorScheme === "dark"
                    ? "rgba(255, 92, 77, 0.08)"
                    : "rgba(255, 92, 77, 0.05)",
              }}
            >
              <Text size="large" color="$primary" fontWeight="600">
                Log Manually
              </Text>
            </Button>
          </Animated.View>

          {/* Collapse button */}
          <Animated.View
            entering={FadeInDown.duration(250).delay(50).springify()}
            exiting={FadeOutUp.duration(200)}
            layout={Layout.springify()}
            style={{ alignSelf: "center" }}
          >
            <Pressable onPress={handleToggle}>
              <Stack
                flexDirection="row"
                alignItems="center"
                gap="$1"
                paddingVertical="$2"
              >
                <ChevronUp size={16} color={iconColor} />
                <Text size="small" color="$textSecondary">
                  Hide
                </Text>
              </Stack>
            </Pressable>
          </Animated.View>
        </>
      )}
    </YStack>
  );
};
