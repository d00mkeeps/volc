import React, { useState } from "react";
import { XStack, Stack, Text, Input, Checkbox } from "tamagui";
import { WorkoutExerciseSet } from "@/types/workout";
import { Ionicons } from "@expo/vector-icons";

interface SetRowProps {
  set: WorkoutExerciseSet;
  exerciseName: string;
  weightUnit?: string;
  isActive?: boolean; // New prop for dormant state
  onUpdate: (set: WorkoutExerciseSet) => void;
}

export default function SetRow({
  set,
  exerciseName,
  weightUnit = "kg",
  isActive = true, // Default to active
  onUpdate,
}: SetRowProps) {
  const [weight, setWeight] = useState(set.weight?.toString() || "");
  const [reps, setReps] = useState(set.reps?.toString() || "");
  const [time, setTime] = useState(set.time?.toString() || "");
  const [distance, setDistance] = useState(set.distance?.toString() || "");
  const [isCompleted, setIsCompleted] = useState(set.is_completed || false);

  const handleCompletionToggle = () => {
    if (!isActive) return; // Don't allow toggle when inactive
    const newValue = !isCompleted;
    setIsCompleted(newValue);
    onUpdate({ ...set, is_completed: newValue });
  };

  const handleWeightChange = (value: string) => {
    if (!isActive) return; // Don't allow changes when inactive
    setWeight(value);
  };

  const handleRepsChange = (value: string) => {
    if (!isActive) return; // Don't allow changes when inactive
    setReps(value);
  };

  // Determine which inputs to show based on exercise type
  const showWeight = true;
  const showReps = true;
  const showTime = false;
  const showDistance = false;

  return (
    <XStack gap="$3" alignItems="center" opacity={isActive ? 1 : 0.6}>
      {/* Set number - centered both horizontally and vertically */}
      <Stack width={30} alignItems="center" justifyContent="center" height={40}>
        <Text
          fontSize="$4"
          fontWeight="600"
          color={isActive ? "$textSoft" : "$textMuted"}
        >
          {set.set_number}
        </Text>
      </Stack>

      {/* Input fields */}
      <XStack flex={1} gap="$2">
        {showWeight && (
          <Stack flex={1}>
            <Input
              size="$4"
              value={weight}
              onChangeText={handleWeightChange}
              placeholder="0"
              keyboardType="numeric"
              textAlign="center"
              backgroundColor={isActive ? "$background" : "$backgroundMuted"}
              borderColor={isActive ? "$borderSoft" : "$borderMuted"}
              color={isActive ? "$color" : "$textMuted"}
              editable={isActive}
              cursor={isActive ? "text" : "default"}
            />
          </Stack>
        )}
        {showReps && (
          <Stack flex={1}>
            <Input
              size="$4"
              value={reps}
              onChangeText={handleRepsChange}
              placeholder="0"
              keyboardType="numeric"
              textAlign="center"
              backgroundColor={isActive ? "$background" : "$backgroundMuted"}
              borderColor={isActive ? "$borderSoft" : "$borderMuted"}
              color={isActive ? "$color" : "$textMuted"}
              editable={isActive}
              cursor={isActive ? "text" : "default"}
            />
          </Stack>
        )}
      </XStack>

      {/* Completion checkbox - 40px square */}
      <Stack width={40} alignItems="center" justifyContent="center">
        <Checkbox
          size="$5"
          width={40}
          height={40}
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
            <Ionicons
              name="checkmark"
              size={16}
              color={isActive ? "white" : "$textMuted"}
            />
          </Checkbox.Indicator>
        </Checkbox>
      </Stack>
    </XStack>
  );
}
