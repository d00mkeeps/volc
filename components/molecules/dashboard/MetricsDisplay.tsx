import React from "react";
import { Stack, YStack } from "tamagui";
import Text from "@/components/atoms/core/Text";

interface ActualMetrics {
  workouts: number;
  exercises: number;
  sets: number;
}

interface MetricsDisplayProps {
  actualMetrics?: ActualMetrics;
}

export default function MetricsDisplay({ actualMetrics }: MetricsDisplayProps) {
  console.log("📊 [MetricsDisplay] Received actualMetrics:", actualMetrics);

  // Helper to pluralize labels
  const pluralize = (count: number, singular: string, plural: string) => {
    return count === 1 ? singular : plural;
  };

  const metrics = [
    {
      label: pluralize(actualMetrics?.workouts || 0, "Workout", "Workouts"),
      value: actualMetrics?.workouts || 0,
    },
    {
      label: pluralize(actualMetrics?.exercises || 0, "Exercise", "Exercises"),
      value: actualMetrics?.exercises || 0,
    },
    {
      label: pluralize(actualMetrics?.sets || 0, "Set", "Sets"),
      value: actualMetrics?.sets || 0,
    },
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
