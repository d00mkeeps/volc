// components/molecules/SetRow.tsx
import React, { useState } from "react";
import { XStack, Stack, Text, Input, Checkbox } from "tamagui";
import { WorkoutExerciseSet } from "@/types/workout";
import { Ionicons } from "@expo/vector-icons";

interface SetRowProps {
  set: WorkoutExerciseSet;
  exerciseName: string;
  weightUnit?: string;
  onUpdate: (set: WorkoutExerciseSet) => void;
}

export default function SetRow({
  set,
  exerciseName,
  weightUnit = "kg",
  onUpdate,
}: SetRowProps) {
  const [weight, setWeight] = useState(set.weight?.toString() || "");
  const [reps, setReps] = useState(set.reps?.toString() || "");
  const [time, setTime] = useState(set.time?.toString() || "");
  const [distance, setDistance] = useState(set.distance?.toString() || "");
  const [isCompleted, setIsCompleted] = useState(set.is_completed || false);

  const handleCompletionToggle = () => {
    const newValue = !isCompleted;
    setIsCompleted(newValue);
    onUpdate({ ...set, is_completed: newValue });
  };

  // Determine which inputs to show based on exercise type
  // For now, showing weight and reps as default
  const showWeight = true;
  const showReps = true;
  const showTime = false;
  const showDistance = false;

  return (
    <XStack gap="$3" alignItems="center">
      {/* Set number */}
      <Stack width={30}>
        <Text fontSize="$4" fontWeight="600" color="$textSoft">
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
              onChangeText={setWeight}
              placeholder="0"
              keyboardType="numeric"
              textAlign="center"
              backgroundColor="$background"
              borderColor="$borderSoft"
            />
            <Text
              fontSize="$1"
              color="$textSoft"
              textAlign="center"
              marginTop="$1"
            >
              {weightUnit}
            </Text>
          </Stack>
        )}

        {showReps && (
          <Stack flex={1}>
            <Input
              size="$4"
              value={reps}
              onChangeText={setReps}
              placeholder="0"
              keyboardType="numeric"
              textAlign="center"
              backgroundColor="$background"
              borderColor="$borderSoft"
            />
            <Text
              fontSize="$1"
              color="$textSoft"
              textAlign="center"
              marginTop="$1"
            >
              reps
            </Text>
          </Stack>
        )}
      </XStack>

      {/* Completion checkbox */}
      <Checkbox
        size="$5"
        checked={isCompleted}
        onCheckedChange={handleCompletionToggle}
        borderColor={isCompleted ? "$primary" : "$borderSoft"}
        backgroundColor={isCompleted ? "$primary" : "$background"}
      >
        <Checkbox.Indicator>
          <Ionicons name="checkmark" size={16} color="white" />
        </Checkbox.Indicator>
      </Checkbox>
    </XStack>
  );
}
