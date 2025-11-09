import React, { useState } from "react";
import { YStack, Stack, useTheme } from "tamagui";
import { Pressable, useColorScheme } from "react-native"; // Add useColorScheme
import Text from "@/components/atoms/core/Text";
import Button from "@/components/atoms/core/Button";
import { ChevronDown, ChevronUp } from "@/assets/icons/IconMap";

interface WorkoutStartButtonProps {
  onPlanWithCoach: () => void;
  onLogManually: () => void;
}

export const WorkoutStartButton = ({
  onPlanWithCoach,
  onLogManually,
}: WorkoutStartButtonProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const theme = useTheme();
  const colorScheme = useColorScheme();

  // Get icon color based on theme - white for dark mode, black for light mode
  const iconColor = colorScheme === "dark" ? "#ffffff" : "#231f20";

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  if (!isExpanded) {
    // Collapsed state - single button with chevron
    return (
      <Button
        onPress={handleToggle}
        width="60%"
        height="$6"
        backgroundColor="$primary"
        pressStyle={{ backgroundColor: "$primaryPress" }}
      >
        <Stack
          flexDirection="row"
          alignItems="center"
          justifyContent="center"
          gap="$2"
        >
          <Text color="white" size="large" fontWeight="600">
            Start Workout
          </Text>
          <ChevronDown size={20} color="white" />
        </Stack>
      </Button>
    );
  }

  // Expanded state - show both options
  return (
    <YStack width="60%" gap="$3" alignSelf="center">
      <Button
        onPress={onPlanWithCoach}
        backgroundColor="$primary"
        height="$6"
        width="100%"
        pressStyle={{ backgroundColor: "$primaryPress" }}
      >
        <Text size="large" color="white" fontWeight="600">
          Plan with Coach
        </Text>
      </Button>

      <Button
        onPress={onLogManually}
        backgroundColor="$background"
        borderColor="$primary"
        borderWidth={2}
        height="$6"
        width="100%"
        pressStyle={{
          backgroundColor: "$backgroundPress",
          borderColor: "$primaryPress",
        }}
      >
        <Text size="large" color="$primary" fontWeight="600">
          Log Manually
        </Text>
      </Button>

      {/* Collapse button */}
      <Pressable onPress={handleToggle} style={{ alignSelf: "center" }}>
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
    </YStack>
  );
};
