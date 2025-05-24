import React, { useState } from "react";
import { Stack, YStack, XStack, Text, Separator } from "tamagui";
import { Ionicons } from "@expo/vector-icons";
import SetRow from "./SetRow";
import { WorkoutExercise } from "@/types/workout";

interface ExerciseTrackerProps {
  exercise: WorkoutExercise;
  isInitiallyExpanded?: boolean;
  isActive?: boolean; // New prop for dormant state
}

export default function ExerciseTracker({
  exercise,
  isInitiallyExpanded = false,
  isActive = true, // Default to active
}: ExerciseTrackerProps) {
  const [isExpanded, setIsExpanded] = useState(isInitiallyExpanded);

  const completedSets = exercise.workout_exercise_sets.filter(
    (set) => set.is_completed
  ).length;
  const totalSets = exercise.workout_exercise_sets.length;

  const toggleExpanded = () => {
    if (!isActive) return; // Don't allow expansion when inactive
    setIsExpanded(!isExpanded);
  };

  return (
    <YStack
      backgroundColor={isActive ? "$backgroundSoft" : "$backgroundMuted"}
      borderRadius="$4"
      overflow="hidden"
      animation="quick"
      opacity={isActive ? 1 : 0.6}
    >
      {/* Header - Always visible */}
      <Stack
        paddingHorizontal="$4"
        paddingVertical="$3"
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
              fontSize="$7"
              fontWeight="600"
              color={isActive ? "$color" : "$textMuted"}
            >
              {exercise.name}
            </Text>
            {!isExpanded && (
              <Text fontSize="$3" color={isActive ? "$textSoft" : "$textMuted"}>
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
          <Separator marginHorizontal="$4" />

          <YStack padding="$1.5" gap="$1.5">
            {/* Column Headers */}
            <XStack gap="$3" alignItems="center" paddingBottom="$2">
              <Stack width={30} alignItems="center" justifyContent="center">
                <Text
                  fontSize="$2"
                  fontWeight="600"
                  color={isActive ? "$textSoft" : "$textMuted"}
                >
                  Set
                </Text>
              </Stack>

              <XStack flex={1} gap="$2">
                <Stack flex={1} alignItems="center" justifyContent="center">
                  <Text
                    fontSize="$3"
                    fontWeight="600"
                    color={isActive ? "$textSoft" : "$textMuted"}
                    textAlign="center"
                  >
                    {exercise.weight_unit || "kg"}
                  </Text>
                </Stack>
                <Stack flex={1} alignItems="center" justifyContent="center">
                  <Text
                    fontSize="$3"
                    fontWeight="600"
                    color={isActive ? "$textSoft" : "$textMuted"}
                    textAlign="center"
                  >
                    reps
                  </Text>
                </Stack>
              </XStack>

              <Stack width={40} alignItems="center" justifyContent="center">
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
                  isActive={isActive} // Pass down active state
                  onUpdate={(updatedSet) => {
                    if (!isActive) return; // Don't allow updates when inactive
                    console.log("Set updated:", updatedSet);
                  }}
                />
              ))}

            {/* Add Set Button */}
            <Stack
              marginTop="$2"
              paddingVertical="$3"
              borderRadius="$3"
              borderWidth={1}
              borderColor={isActive ? "$borderSoft" : "$borderMuted"}
              borderStyle="dashed"
              alignItems="center"
              backgroundColor={isActive ? "transparent" : "$backgroundMuted"}
              pressStyle={
                isActive
                  ? {
                      backgroundColor: "$backgroundPress",
                    }
                  : undefined
              }
              onPress={isActive ? () => console.log("Add set") : undefined}
              cursor={isActive ? "pointer" : "default"}
            >
              <XStack gap="$2" alignItems="center">
                <Ionicons
                  name="add"
                  size={20}
                  color={isActive ? "$textSoft" : "$textMuted"}
                />
                <Text
                  fontSize="$3"
                  color={isActive ? "$textSoft" : "$textMuted"}
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
