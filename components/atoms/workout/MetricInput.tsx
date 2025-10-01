// /components/atoms/MetricInput.tsx
import React, { useState } from "react";
import { XStack } from "tamagui";
import Input from "@/components/atoms/core/Input";
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
  const [error, setError] = useState<string | undefined>();

  const validateAndUpdate = (val: string) => {
    const sanitized = WorkoutValidation.sanitizeNumeric(val);
    const numValue = parseFloat(sanitized);
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
    return validation.isValid ? numValue : undefined;
  };

  return (
    <XStack flex={1} gap="$1" alignItems="center">
      <Input
        flex={1}
        size="$3"
        value={localValue}
        onChangeText={(text) => {
          const sanitized = WorkoutValidation.sanitizeNumeric(text);
          setLocalValue(sanitized);
        }}
        onBlur={() => {
          const validated = validateAndUpdate(localValue);
          onChange(validated);
        }}
        // selectTextOnFocus
        placeholder="0"
        keyboardType="numeric"
        textAlign="center"
        backgroundColor="$background"
        borderColor={error ? "$error" : "$borderMuted"}
        color="$color"
        editable={isActive}
        focusStyle={{ borderColor: "$primary" }}
      />
    </XStack>
  );
}
