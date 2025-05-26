// components/molecules/ExerciseTracker.tsx
import React, { useState } from "react";
import { Stack, YStack, XStack, Text, Separator } from "tamagui";
import { Ionicons } from "@expo/vector-icons";
import SetRow from "./SetRow";
import { WorkoutExercise, WorkoutExerciseSet } from "@/types/workout";

interface ExerciseTrackerProps {
  exercise: WorkoutExercise;
  isInitiallyExpanded?: boolean;
  isActive?: boolean;
  onExerciseUpdate?: (updatedExercise: WorkoutExercise) => void;
}

export default function ExerciseTracker({
  exercise,
  isInitiallyExpanded = false,
  isActive = true,
  onExerciseUpdate,
}: ExerciseTrackerProps) {
  const [isExpanded, setIsExpanded] = useState(isInitiallyExpanded);

  const completedSets = exercise.workout_exercise_sets.filter(
    (set) => set.is_completed
  ).length;
  const totalSets = exercise.workout_exercise_sets.length;

  const toggleExpanded = () => {
    if (!isActive) return;
    setIsExpanded(!isExpanded);
  };

  const handleSetUpdate = (updatedSet: WorkoutExerciseSet) => {
    if (!isActive || !onExerciseUpdate) return;

    const updatedExercise = {
      ...exercise,
      workout_exercise_sets: exercise.workout_exercise_sets.map((set) =>
        set.id === updatedSet.id ? updatedSet : set
      ),
    };

    onExerciseUpdate(updatedExercise);
  };

  const handleAddSet = () => {
    if (!isActive || !onExerciseUpdate) return;

    const newSet: WorkoutExerciseSet = {
      id: `set-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      exercise_id: exercise.id,
      set_number: exercise.workout_exercise_sets.length + 1,
      weight: undefined,
      reps: undefined,
      distance: undefined,
      is_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedExercise = {
      ...exercise,
      workout_exercise_sets: [...exercise.workout_exercise_sets, newSet],
    };

    onExerciseUpdate(updatedExercise);
  };

  return (
    <YStack
      backgroundColor={isActive ? "$backgroundSoft" : "$backgroundMuted"}
      borderRadius="$3"
      overflow="hidden"
      animation="quick"
      opacity={isActive ? 1 : 0.6}
    >
      {/* Header */}
      <Stack
        paddingHorizontal="$3"
        paddingVertical="$1.5"
        onPress={toggleExpanded}
        pressStyle={
          isActive
            ? {
                backgroundColor: "$backgroundPress",
              }
            : undefined
        }
        cursor={isActive ? "pointer" : "default"}
      >
        <XStack justifyContent="space-between" alignItems="center">
          <YStack flex={1} gap="$1">
            <Text
              fontSize="$5"
              fontWeight="600"
              color={isActive ? "$color" : "$textMuted"}
            >
              {exercise.name}
            </Text>
            {!isExpanded && (
              <Text fontSize="$2" color={isActive ? "$textSoft" : "$textMuted"}>
                {completedSets}/{totalSets} sets completed
              </Text>
            )}
          </YStack>

          <Stack
            animation="quick"
            rotate={isExpanded ? "180deg" : "0deg"}
            opacity={isActive ? 1 : 0.4}
          >
            <Ionicons
              name="chevron-down"
              size={20}
              color={isActive ? "$textSoft" : "$textMuted"}
            />
          </Stack>
        </XStack>
      </Stack>

      {/* Expanded Content */}
      {isExpanded && (
        <>
          <Separator marginHorizontal="$3" borderColor="$borderSoft" />

          <YStack padding="$1.5" gap="$1.5">
            {/* Column Headers */}
            <XStack gap="$3" alignItems="center" paddingBottom="$1">
              <Stack width={30} alignItems="center">
                <Text
                  fontSize="$2"
                  fontWeight="600"
                  color={isActive ? "$textSoft" : "$textMuted"}
                >
                  Set
                </Text>
              </Stack>

              <XStack flex={1} gap="$1.5">
                <Stack flex={1} alignItems="center">
                  <Text
                    fontSize="$2"
                    fontWeight="600"
                    color={isActive ? "$textSoft" : "$textMuted"}
                    textAlign="center"
                  >
                    {exercise.weight_unit || "kg"}
                  </Text>
                </Stack>
                <Stack flex={1} alignItems="center">
                  <Text
                    fontSize="$2"
                    fontWeight="600"
                    color={isActive ? "$textSoft" : "$textMuted"}
                    textAlign="center"
                  >
                    reps
                  </Text>
                </Stack>
              </XStack>

              <Stack width={40} alignItems="center">
                <Text
                  fontSize="$2"
                  fontWeight="600"
                  color={isActive ? "$textSoft" : "$textMuted"}
                  textAlign="center"
                >
                  ✓
                </Text>
              </Stack>
            </XStack>

            {/* Sets */}
            {exercise.workout_exercise_sets
              .sort((a, b) => a.set_number - b.set_number)
              .map((set) => (
                <SetRow
                  key={set.id}
                  set={set}
                  exerciseName={exercise.name}
                  weightUnit={exercise.weight_unit}
                  isActive={isActive}
                  onUpdate={handleSetUpdate}
                />
              ))}

            {/* Add Set Button */}
            <Stack
              marginTop="$1.5"
              paddingVertical="$1.5"
              borderRadius="$3"
              borderWidth={1}
              borderColor={isActive ? "$borderSoft" : "$borderMuted"}
              borderStyle="dashed"
              alignItems="center"
              backgroundColor="transparent"
              pressStyle={
                isActive
                  ? {
                      backgroundColor: "$primaryTint",
                      borderColor: "$primary",
                    }
                  : undefined
              }
              onPress={isActive ? handleAddSet : undefined}
              cursor={isActive ? "pointer" : "default"}
            >
              <XStack gap="$1.5" alignItems="center">
                <Ionicons
                  name="add"
                  size={18}
                  color={isActive ? "$primary" : "$textMuted"}
                />
                <Text
                  fontSize="$3"
                  color={isActive ? "$primary" : "$textMuted"}
                  fontWeight="500"
                >
                  Add Set
                </Text>
              </XStack>
            </Stack>
          </YStack>
        </>
      )}
    </YStack>
  );
}
