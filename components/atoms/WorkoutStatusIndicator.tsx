// components/atoms/WorkoutStatusIndicator.tsx
import React from "react";
import { XStack, Text, Stack } from "tamagui";

interface WorkoutStatusIndicatorProps {
  isActive: boolean;
}

export default function WorkoutStatusIndicator({
  isActive,
}: WorkoutStatusIndicatorProps) {
  return (
    <XStack gap="$2" alignItems="center">
      {/* Status dot */}
      <Stack
        width={8}
        height={8}
        borderRadius="$10"
        backgroundColor={isActive ? "$green" : "$gray"}
        animation="quick"
      />

      {/* Status text */}
      <Text
        fontSize="$3"
        color={isActive ? "$green" : "$textMuted"}
        fontWeight="500"
      >
        {isActive ? "Workout in progress" : "Workout not started"}
      </Text>
    </XStack>
  );
}
