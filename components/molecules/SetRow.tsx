// components/molecules/SetRow.tsx
import React, { useState } from "react";
import { XStack, Stack, Text, Input, Checkbox } from "tamagui";
import { WorkoutExerciseSet } from "@/types/workout";
import { Ionicons } from "@expo/vector-icons";

interface SetRowProps {
  set: WorkoutExerciseSet;
  exerciseName: string;
  weightUnit?: string;
  isActive?: boolean;
  onUpdate: (set: WorkoutExerciseSet) => void;
}

export default function SetRow({
  set,
  exerciseName,
  weightUnit = "kg",
  isActive = true,
  onUpdate,
}: SetRowProps) {
  const [weight, setWeight] = useState(set.weight?.toString() || "");
  const [reps, setReps] = useState(set.reps?.toString() || "");
  const [isCompleted, setIsCompleted] = useState(set.is_completed || false);

  const handleCompletionToggle = () => {
    if (!isActive) return;
    const newValue = !isCompleted;
    setIsCompleted(newValue);
    onUpdate({
      ...set,
      is_completed: newValue,
      updated_at: new Date().toISOString(),
    });
  };

  const handleWeightChange = (value: string) => {
    if (!isActive) return;
    setWeight(value);
  };

  const handleWeightBlur = () => {
    if (!isActive) return;
    const numericValue = parseFloat(weight) || undefined;
    if (numericValue !== set.weight) {
      onUpdate({
        ...set,
        weight: numericValue,
        updated_at: new Date().toISOString(),
      });
    }
  };

  const handleRepsChange = (value: string) => {
    if (!isActive) return;
    setReps(value);
  };

  const handleRepsBlur = () => {
    if (!isActive) return;
    const numericValue = parseInt(reps) || undefined;
    if (numericValue !== set.reps) {
      onUpdate({
        ...set,
        reps: numericValue,
        updated_at: new Date().toISOString(),
      });
    }
  };

  return (
    <XStack gap="$3" alignItems="center" opacity={isActive ? 1 : 0.6}>
      {/* Set number */}
      <Stack width={30} alignItems="center" justifyContent="center" height={40}>
        <Text
          fontSize="$3"
          fontWeight="600"
          color={isActive ? "$textSoft" : "$textMuted"}
        >
          {set.set_number}
        </Text>
      </Stack>

      {/* Input fields */}
      <XStack flex={1} gap="$1.5">
        <Stack flex={1}>
          <Input
            size="$3"
            value={weight}
            onChangeText={handleWeightChange}
            onBlur={handleWeightBlur}
            placeholder="0"
            keyboardType="numeric"
            textAlign="center"
            backgroundColor={isActive ? "$background" : "$backgroundMuted"}
            borderColor={isActive ? "$borderSoft" : "$borderMuted"}
            color={isActive ? "$color" : "$textMuted"}
            editable={isActive}
            cursor={isActive ? "text" : "default"}
            focusStyle={{
              borderColor: "$primary",
            }}
          />
        </Stack>
        <Stack flex={1}>
          <Input
            size="$3"
            value={reps}
            onChangeText={handleRepsChange}
            onBlur={handleRepsBlur}
            placeholder="0"
            keyboardType="numeric"
            textAlign="center"
            backgroundColor={isActive ? "$background" : "$backgroundMuted"}
            borderColor={isActive ? "$borderSoft" : "$borderMuted"}
            color={isActive ? "$color" : "$textMuted"}
            editable={isActive}
            cursor={isActive ? "text" : "default"}
            focusStyle={{
              borderColor: "$primary",
            }}
          />
        </Stack>
      </XStack>

      {/* Completion checkbox */}
      <Stack width={40} alignItems="center" justifyContent="center">
        <Checkbox
          size="$4"
          width={36}
          height={36}
          checked={isCompleted}
          onCheckedChange={isActive ? handleCompletionToggle : undefined}
          borderColor={
            isActive
              ? isCompleted
                ? "$primary"
                : "$borderSoft"
              : "$borderMuted"
          }
          backgroundColor={
            isActive
              ? isCompleted
                ? "$primary"
                : "$background"
              : "$backgroundMuted"
          }
          cursor={isActive ? "pointer" : "default"}
        >
          <Checkbox.Indicator>
            <Ionicons name="checkmark" size={16} color="white" />
          </Checkbox.Indicator>
        </Checkbox>
      </Stack>
    </XStack>
  );
}
