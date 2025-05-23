// components/molecules/GoalProgressRing.tsx
import React from "react";
import { Stack, Text } from "tamagui";
import Svg, { Circle } from "react-native-svg";

interface GoalProgressRingProps {
  percentage: number;
  label?: string;
}

export default function GoalProgressRing({
  percentage,
  label = "Weekly Goal",
}: GoalProgressRingProps) {
  const size = 160;
  const strokeWidth = 36;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Stack
      width={240}
      height={240}
      backgroundColor="$backgroundSoft"
      borderRadius="$4"
      padding="$4"
      justifyContent="center"
      alignItems="center"
      gap="$2"
    >
      <Stack position="relative" justifyContent="center" alignItems="center">
        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e0e0e0"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#007AFF"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>

        {/* Percentage text in center */}
        <Stack position="absolute" justifyContent="center" alignItems="center">
          <Text fontSize="$6" fontWeight="600" color="$color">
            {Math.round(percentage)}%
          </Text>
        </Stack>
      </Stack>

      <Text fontSize="$3" color="$colorPress" textAlign="center">
        {label}
      </Text>
    </Stack>
  );
}
