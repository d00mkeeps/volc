import React, { useState, useEffect } from "react";
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
    // Handle empty string - just clear the value
    if (!val || val === "" || val === "0") {
      onChange(undefined);
      return;
    }

    const sanitized = WorkoutValidation.sanitizeNumeric(val);
    const numValue = parseFloat(sanitized);

    // Handle NaN
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

  // Check the actual value prop, not localValue
  const isEmpty = value === undefined || value === null || value === 0;
  const shouldShowError = showError && isEmpty;

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
          validateAndUpdate(localValue);
        }}
        placeholder="0"
        keyboardType="numeric"
        textAlign="center"
        backgroundColor="$background"
        borderColor={
          shouldShowError ? "$red8" : error ? "$error" : "$borderMuted"
        }
        color="$color"
        editable={isActive}
        focusStyle={{ borderColor: "$primary" }}
      />
    </XStack>
  );
}
