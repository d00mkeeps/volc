import React, { useState } from "react";
import { Stack, YStack, XStack, Text, Separator } from "tamagui";
import { Ionicons } from "@expo/vector-icons";
import SetRow from "./SetRow";
import { WorkoutExercise } from "@/types/workout";

interface ExerciseTrackerProps {
  exercise: WorkoutExercise;
  isInitiallyExpanded?: boolean;
}

export default function ExerciseTracker({
  exercise,
  isInitiallyExpanded = false,
}: ExerciseTrackerProps) {
  const [isExpanded, setIsExpanded] = useState(isInitiallyExpanded);

  const completedSets = exercise.workout_exercise_sets.filter(
    (set) => set.is_completed
  ).length;
  const totalSets = exercise.workout_exercise_sets.length;

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <YStack
      backgroundColor="$backgroundSoft"
      borderRadius="$4"
      overflow="hidden"
      animation="quick"
    >
      {/* Header - Always visible */}
      <Stack
        paddingHorizontal="$4"
        paddingVertical="$3"
        onPress={toggleExpanded}
        pressStyle={{
          backgroundColor: "$backgroundPress",
        }}
      >
        <XStack justifyContent="space-between" alignItems="center">
          <YStack flex={1} gap="$1">
            <Text fontSize="$5" fontWeight="600" color="$color">
              {exercise.name}
            </Text>
            {!isExpanded && (
              <Text fontSize="$3" color="$textSoft">
                {completedSets}/{totalSets} sets completed
              </Text>
            )}
          </YStack>

          <Stack animation="quick" rotate={isExpanded ? "180deg" : "0deg"}>
            <Ionicons name="chevron-down" size={20} color="$textSoft" />
          </Stack>
        </XStack>
      </Stack>

      {/* Expanded Content */}
      {isExpanded && (
        <>
          <Separator marginHorizontal="$4" />

          <YStack padding="$4" gap="$3">
            {exercise.workout_exercise_sets
              .sort((a, b) => a.set_number - b.set_number)
              .map((set, index) => (
                <React.Fragment key={set.id}>
                  <SetRow
                    set={set}
                    exerciseName={exercise.name}
                    weightUnit={exercise.weight_unit}
                    onUpdate={(updatedSet) => {
                      // Handle update - will implement with data handling
                      console.log("Set updated:", updatedSet);
                    }}
                  />
                  {index < exercise.workout_exercise_sets.length - 1 && (
                    <Separator />
                  )}
                </React.Fragment>
              ))}

            {/* Add Set Button */}
            <Stack
              marginTop="$2"
              paddingVertical="$3"
              borderRadius="$3"
              borderWidth={1}
              borderColor="$borderSoft"
              borderStyle="dashed"
              alignItems="center"
              pressStyle={{
                backgroundColor: "$backgroundPress",
              }}
              onPress={() => console.log("Add set")}
            >
              <XStack gap="$2" alignItems="center">
                <Ionicons name="add" size={20} color="$textSoft" />
                <Text fontSize="$3" color="$textSoft">
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
