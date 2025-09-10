import React from "react";
import { Stack, YStack } from "tamagui";
import Text from "@/components/atoms/Text";

interface ActualMetrics {
  workouts: number;
  exercises: number;
  sets: number;
}

interface MetricsDisplayProps {
  actualMetrics?: ActualMetrics; // Make it optional for safety
}

export default function MetricsDisplay({ actualMetrics }: MetricsDisplayProps) {
  console.log("📊 [MetricsDisplay] Received actualMetrics:", actualMetrics);
  const metrics = [
    { label: "Workouts", value: actualMetrics?.workouts || 0 },
    { label: "Exercises", value: actualMetrics?.exercises || 0 },
    { label: "Sets", value: actualMetrics?.sets || 0 },
  ];
  console.log("📋 [MetricsDisplay] Computed metrics:", metrics);

  return (
    <Stack gap="$3" paddingLeft="$2" paddingTop="$3" borderRadius="$3">
      <Stack flexDirection="row">
        {/* Values Stack */}
        <YStack flex={1} gap="$2" justifyContent="space-between">
          {metrics.map((metric, index) => (
            <Text key={index} size="medium" fontWeight="600" color="$text">
              {metric.value}
            </Text>
          ))}
        </YStack>

        {/* Labels Stack */}
        <YStack flex={2.5} gap="$6" justifyContent="space-between">
          {metrics.map((metric, index) => (
            <Text key={index} color="$textSoft" size="medium">
              {metric.label}
            </Text>
          ))}
        </YStack>
      </Stack>
    </Stack>
  );
}
