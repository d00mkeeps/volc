import React, { useState } from "react";
import { XStack, Stack, Input, Text } from "tamagui";
import * as Haptics from "expo-haptics";

interface MetricInputProps {
  type: "weight" | "reps" | "distance" | "duration";
  value: number | string | null | undefined; // Add null here
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

  const getIncrement = () => {
    switch (type) {
      case "weight":
        return isMetric ? 2.5 : 5;
      case "reps":
        return 1;
      case "distance":
        return isMetric ? 0.5 : 0.25;
      case "duration":
        return 30; // seconds
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

  const formatPlaceholder = () => {
    return type === "duration" ? "0:00" : "0";
  };

  return (
    <XStack flex={1} gap="$1" alignItems="center">
      {isFocused && (
        <Stack
          width={30}
          height={30}
          justifyContent="center"
          alignItems="center"
          borderRadius="$2"
          backgroundColor="$backgroundPress"
          onPress={() => handleIncrement("down")}
        >
          <Text fontSize="$3" color="$primary">
            −{getIncrement()}
          </Text>
        </Stack>
      )}

      <Input
        flex={1}
        size="$3"
        value={localValue}
        onChangeText={setLocalValue}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          if (type === "duration") {
            // Duration stays as string for now
            onChange(localValue as any);
          } else {
            onChange(parseFloat(localValue) || undefined);
          }
        }}
        selectTextOnFocus
        placeholder={formatPlaceholder()}
        keyboardType="numeric"
        textAlign="center"
        backgroundColor={isActive ? "$background" : "$backgroundMuted"}
        borderColor={isActive ? "$borderSoft" : "$borderMuted"}
        color={isActive ? "$color" : "$textMuted"}
        editable={isActive}
        focusStyle={{ borderColor: "$primary" }}
        maxWidth={type === "duration" ? 80 : undefined}
      />

      {isFocused && (
        <Stack
          width={30}
          height={30}
          justifyContent="center"
          alignItems="center"
          borderRadius="$2"
          backgroundColor="$backgroundPress"
          onPress={() => handleIncrement("up")}
        >
          <Text fontSize="$3" color="$primary">
            +{getIncrement()}
          </Text>
        </Stack>
      )}
    </XStack>
  );
}
