import React from "react";
import { Stack, Text, YStack } from "tamagui";
import Svg, { Circle } from "react-native-svg";

interface GoalProgressRingProps {
  percentage: number;
  label?: string;
  currentValue?: string;
  targetValue?: string;
}

export default function GoalProgressRing({
  percentage,
  label = "Weekly Goal",
  currentValue,
  targetValue,
}: GoalProgressRingProps) {
  const size = 140;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Stack
      width={240}
      height={200}
      backgroundColor="$backgroundSoft"
      borderRadius="$3"
      padding="$3"
      justifyContent="center"
      alignItems="center"
      gap="$1.5"
    >
      {/* Progress Ring */}
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
            stroke="#f84f3e"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>

        {/* Center content */}
        <YStack
          position="absolute"
          justifyContent="center"
          alignItems="center"
          gap="$1"
        >
          <Text fontSize="$6" fontWeight="700" color="$primary">
            {Math.round(percentage)}%
          </Text>
          {currentValue && targetValue && (
            <YStack alignItems="center" gap="$0.5">
              <Text fontSize="$3" fontWeight="600" color="$color">
                {currentValue}
              </Text>
              <Text fontSize="$2" color="$textSoft">
                of {targetValue}
              </Text>
            </YStack>
          )}
        </YStack>
      </Stack>

      {/* Label */}
      <Text
        fontSize="$3"
        color="$textSoft"
        textAlign="center"
        fontWeight="500"
        numberOfLines={2}
      >
        {label}
      </Text>
    </Stack>
  );
}
