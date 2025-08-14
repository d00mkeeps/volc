import React from "react";
import { Stack, Text, YStack } from "tamagui";

interface MetricItem {
  label: string;
  value: string | number;
}

interface MetricsDisplayProps {
  metrics: MetricItem[];
}

export default function MetricsDisplay({ metrics }: MetricsDisplayProps) {
  return (
    <Stack gap="$3" paddingLeft="$2" paddingTop="$3" borderRadius="$3">
      <Stack flexDirection="row">
        {/* Values Stack */}
        <YStack flex={1} gap="$2" justifyContent="space-between">
          {metrics.map((metric, index) => (
            <Text key={index} fontSize="$5" fontWeight="600" color="$text">
              {metric.value}
            </Text>
          ))}
        </YStack>
        {/* Labels Stack */}
        <YStack flex={2.5} gap="$6" justifyContent="space-between">
          {metrics.map((metric, index) => (
            <Text key={index} color="$textSoft" fontSize="$5">
              {metric.label}
            </Text>
          ))}
        </YStack>
      </Stack>
    </Stack>
  );
}
