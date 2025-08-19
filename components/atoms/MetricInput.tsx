// /components/atoms/MetricInput.tsx

import React, { useState } from "react";
import { XStack, Stack, Input, Text } from "tamagui";
import * as Haptics from "expo-haptics";
import { WorkoutValidation } from "@/utils/validation";

interface MetricInputProps {
  type: "weight" | "reps" | "distance" | "duration";
  value: number | string | null | undefined;
  unit?: string;
  isMetric: boolean;
  onChange: (value: number | undefined) => void;
  isActive: boolean;
}

export default function MetricInput({
  type,
  value,
  unit,
  isMetric,
  onChange,
  isActive,
}: MetricInputProps) {
  const [localValue, setLocalValue] = useState(value?.toString() || "");
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const getIncrement = () => {
    switch (type) {
      case "weight":
        return isMetric ? 2.5 : 5;
      case "reps":
        return 1;
      case "distance":
        return isMetric ? 0.5 : 0.25;
      default:
        return 1;
    }
  };

  const handleIncrement = (direction: "up" | "down") => {
    const current = parseFloat(localValue) || 0;
    const increment = getIncrement();
    const newValue =
      direction === "up"
        ? current + increment
        : Math.max(0, current - increment);

    setLocalValue(newValue.toString());
    onChange(newValue);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const validateAndUpdate = (val: string) => {
    const sanitized = WorkoutValidation.sanitizeNumeric(val);
    const numValue = parseFloat(sanitized);

    let validation: { isValid: boolean; error?: string } = { isValid: true }; // Changed this line

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
    return validation.isValid ? numValue : undefined;
  };

  return (
    <XStack flex={1} gap="$1" alignItems="center">
      {isFocused && type !== "duration" && (
        <Stack
          width={30}
          height={30}
          justifyContent="center"
          alignItems="center"
          borderRadius="$2"
          backgroundColor="$backgroundPress"
          onPress={() => handleIncrement("down")}
        >
          <Text fontSize="$4" color="$primary">
            −{getIncrement()}
          </Text>
        </Stack>
      )}

      <Input
        flex={1}
        size="$3"
        value={localValue}
        onChangeText={(text) => {
          const sanitized = WorkoutValidation.sanitizeNumeric(text);
          setLocalValue(sanitized);
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          const validated = validateAndUpdate(localValue);
          onChange(validated);
        }}
        selectTextOnFocus
        placeholder="0"
        keyboardType="numeric"
        textAlign="center"
        backgroundColor={isActive ? "$background" : "$backgroundMuted"}
        borderColor={
          error ? "$error" : isActive ? "$borderSoft" : "$borderMuted"
        }
        color={isActive ? "$color" : "$textMuted"}
        editable={isActive}
        focusStyle={{ borderColor: "$primary" }}
      />

      {isFocused && type !== "duration" && (
        <Stack
          width={30}
          height={30}
          justifyContent="center"
          alignItems="center"
          borderRadius="$2"
          backgroundColor="$backgroundPress"
          onPress={() => handleIncrement("up")}
        >
          <Text fontSize="$4" color="$primary">
            +{getIncrement()}
          </Text>
        </Stack>
      )}
    </XStack>
  );
}
