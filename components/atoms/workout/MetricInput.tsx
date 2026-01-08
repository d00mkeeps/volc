import React, { useState, useEffect } from "react";
import { YStack, XStack, Stack } from "tamagui";
import Input from "@/components/atoms/core/Input";
import Text from "@/components/atoms/core/Text";
import { WorkoutValidation } from "@/utils/validation";

interface MetricInputProps {
  type: "weight" | "reps" | "distance" | "duration";
  value: number | string | null | undefined;
  unit?: string;
  isMetric: boolean;
  onChange: (value: number | undefined) => void;
  isActive: boolean;
  showError?: boolean;
}

export default function MetricInput({
  type,
  value,
  unit,
  isMetric,
  onChange,
  isActive,
  showError = false,
}: MetricInputProps) {
  const [localValue, setLocalValue] = useState(value?.toString() || "");
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    setLocalValue(value?.toString() || "");
  }, [value]);

  const validateAndUpdate = (val: string) => {
    if (!val || val === "" || val === "0") {
      onChange(undefined);
      return;
    }

    const sanitized = WorkoutValidation.sanitizeNumeric(val);
    const numValue = parseFloat(sanitized);

    if (isNaN(numValue)) {
      onChange(undefined);
      return;
    }

    let validation: { isValid: boolean; error?: string } = { isValid: true };

    switch (type) {
      case "weight":
        validation = WorkoutValidation.weight(numValue, isMetric);
        break;
      case "reps":
        validation = WorkoutValidation.reps(numValue);
        break;
      case "distance":
        validation = WorkoutValidation.distance(numValue, isMetric);
        break;
    }

    setError(validation.error);
    onChange(validation.isValid ? numValue : undefined);
  };

  const isEmpty = value === undefined || value === null || value === 0;
  const shouldShowError = showError && isEmpty;

  const getMetricLabel = () => {
    switch (type) {
      case "weight":
        return "weight";
      case "reps":
        return "reps";
      case "distance":
        return "distance";
      default:
        return "value";
    }
  };

  return (
    <YStack flex={1} position="relative">
      <XStack flex={1} alignItems="center">
        <Input
          flex={1}
          size="$3"
          value={localValue}
          onChangeText={(text) => {
            const sanitized = WorkoutValidation.sanitizeNumeric(text);
            setLocalValue(sanitized);
          }}
          onBlur={() => {
            validateAndUpdate(localValue);
          }}
          placeholder="0"
          placeholderTextColor={shouldShowError ? "$red8" : "$textMuted"}
          keyboardType="decimal-pad" // For decimals (weight, distance)
          textAlign="center"
          backgroundColor={
            shouldShowError ? "rgba(239, 68, 68, 0.08)" : "$background"
          }
          borderColor={
            shouldShowError ? "$red8" : error ? "$error" : "$borderMuted"
          }
          borderWidth={shouldShowError ? 1.5 : 1}
          color="$color"
          editable={isActive}
          focusStyle={{ borderColor: "$primary" }}
        />
      </XStack>
      {shouldShowError && (
        <Stack
          position="absolute"
          top="75%"
          left={0}
          right={0}
          paddingHorizontal="$1"
        >
          <Text size="small" color="$red8" textAlign="center" numberOfLines={1}>
            missing {getMetricLabel()}
          </Text>
        </Stack>
      )}
    </YStack>
  );
}
