// /components/molecules/dashboard/DashboardSkeleton.tsx

import React from "react";
import { Stack, XStack, YStack } from "tamagui";
import Svg, { Circle, Line } from "react-native-svg";
import ShimmerBox from "@/components/atoms/core/ShimmerBox";

export default function DashboardSkeleton() {
  const size = 260;
  const center = size / 2;
  const maxRadius = 80;
  const numberOfLines = 6;

  return (
    <Stack gap="$3">
      {/* MuscleGroupSpider Skeleton */}
      <Stack
        width="100%"
        height={230}
        backgroundColor="$backgroundSoft"
        borderRadius="$3"
        flexDirection="row"
        paddingRight="$1.5"
      >
        {/* Left Stack - Metrics Area */}
        <Stack flex={0.5} gap="$2" padding="$2">
          {/* Select dropdown skeleton */}
          <ShimmerBox height={40} borderRadius={12} />

          {/* Metrics skeletons - 3 rows with number + label side by side */}
          <Stack gap="$2.5" marginTop="$1">
            {/* Workouts */}

            <XStack gap="$3" alignItems="center">
              <ShimmerBox height={30} width={36} borderRadius={6} />
              <ShimmerBox height={24} width={88} borderRadius={6} />
            </XStack>

            {/* Exercises */}
            <XStack paddingTop="$3" gap="$3" alignItems="center">
              <ShimmerBox height={30} width={36} borderRadius={6} />
              <ShimmerBox height={24} width={88} borderRadius={6} />
            </XStack>

            {/* Sets */}
            <XStack paddingTop="$3" gap="$3" alignItems="center">
              <ShimmerBox height={30} width={36} borderRadius={6} />
              <ShimmerBox height={24} width={88} borderRadius={6} />
            </XStack>
          </Stack>
        </Stack>

        {/* Right Stack - Spider Chart Skeleton */}
        <Stack flex={1} justifyContent="center" alignItems="center">
          <Svg width={size} height={size}>
            {/* Background grid circles */}
            {[0.25, 0.5, 0.75, 1.0].map((ratio, i) => (
              <Circle
                key={i}
                cx={center}
                cy={center}
                r={maxRadius * ratio}
                stroke="#ef4444"
                strokeWidth={1}
                fill="transparent"
                opacity={0.2}
              />
            ))}

            {/* Grid lines */}
            {[...Array(numberOfLines)].map((_, index) => {
              const angle = (index * 2 * Math.PI) / numberOfLines - Math.PI / 2;
              const endX = center + maxRadius * Math.cos(angle);
              const endY = center + maxRadius * Math.sin(angle);
              return (
                <Line
                  key={index}
                  x1={center}
                  y1={center}
                  x2={endX}
                  y2={endY}
                  stroke="#ef4444"
                  strokeWidth={1}
                  opacity={0.2}
                />
              );
            })}
          </Svg>
        </Stack>
      </Stack>

      {/* ConsistencyCalendar Skeleton */}
      <Stack
        backgroundColor="$backgroundSoft"
        borderRadius="$3"
        padding="$3"
        gap="$3"
      >
        {/* Header */}
        <XStack justifyContent="space-between" alignItems="center">
          <ShimmerBox height={18} width={120} borderRadius={6} />
          <ShimmerBox height={16} width={80} borderRadius={6} />
        </XStack>

        {/* Calendar week - 7 days horizontally */}
        <XStack gap="$1" justifyContent="space-evenly" alignItems="center">
          {[...Array(7)].map((_, dayIndex) => (
            <YStack key={dayIndex} alignItems="center" flex={1}>
              <ShimmerBox width={40} height={40} borderRadius={12} />
            </YStack>
          ))}
        </XStack>
      </Stack>
    </Stack>
  );
}
