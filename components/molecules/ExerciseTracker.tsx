// components/molecules/ExerciseTracker.tsx
import React, { useState } from "react";
import { Stack, YStack, XStack, Text, Separator } from "tamagui";
import { Ionicons } from "@expo/vector-icons";
import SetRow from "./SetRow";
import { WorkoutExercise, WorkoutExerciseSet } from "@/types/workout";
import { Alert } from "react-native";
import ExerciseSearchInput from "./ExerciseSearchInput";
import { useExerciseStore } from "@/stores/workout/exerciseStore";
interface ExerciseTrackerProps {
  exercise: WorkoutExercise;
  isInitiallyExpanded?: boolean;
  isActive?: boolean;
  onExerciseUpdate?: (updatedExercise: WorkoutExercise) => void;
  onExerciseDelete?: (exerciseId: string) => void;
  startInEditMode?: boolean;
}

export default function ExerciseTracker({
  exercise,
  isInitiallyExpanded = false,
  isActive = true,
  onExerciseUpdate,
  onExerciseDelete, // Add this
  startInEditMode,
}: ExerciseTrackerProps) {
  const [isExpanded, setIsExpanded] = useState(isInitiallyExpanded);
  const [isEditing, setIsEditing] = useState(
    startInEditMode || exercise.name === ""
  );
  const [selectedExercise, setSelectedExercise] = useState(exercise.name); // Track selected exercise

  // Your existing logic...
  const completedSets = exercise.workout_exercise_sets.filter(
    (set) => set.is_completed
  ).length;
  const totalSets = exercise.workout_exercise_sets.length;

  // Check if exercise has data (simpler version)
  const hasExerciseData =
    exercise.workout_exercise_sets.length > 0 &&
    (exercise.workout_exercise_sets[0].weight !== undefined ||
      exercise.workout_exercise_sets[0].reps !== undefined ||
      exercise.workout_exercise_sets[0].is_completed);

  const toggleExpanded = () => {
    if (!isActive || isEditing) return; // Don't expand when editing
    setIsExpanded(!isExpanded);
  };

  const handleEditPress = () => {
    setIsEditing(true);
    setSelectedExercise(exercise.name); // Pre-fill with current exercise
  };

  const handleSavePress = () => {
    if (!onExerciseUpdate) return;

    // Find the selected exercise definition
    const { exercises } = useExerciseStore.getState();
    const selectedDefinition = exercises.find(
      (ex) => ex.standard_name === selectedExercise
    );

    // Update exercise with new name AND definition ID
    const updatedExercise = {
      ...exercise,
      name: selectedExercise,
      definition_id: selectedDefinition?.id, // Link to definition
    };

    onExerciseUpdate(updatedExercise);
    setIsEditing(false);
  };
  const handleDelete = () => {
    if (!onExerciseDelete) return;

    if (hasExerciseData) {
      Alert.alert(
        "Delete Exercise",
        `Remove ${exercise.name} and all set data from workout?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              onExerciseDelete(exercise.id);
            },
          },
        ]
      );
    } else {
      // No data to lose, delete immediately
      onExerciseDelete(exercise.id);
    }
  };

  // Your existing handlers...
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
        onPress={isEditing ? undefined : toggleExpanded} // Disable click when editing
        pressStyle={
          isActive && !isEditing
            ? {
                backgroundColor: "$backgroundPress",
              }
            : undefined
        }
        cursor={isActive && !isEditing ? "pointer" : "default"}
      >
        <XStack justifyContent="space-between" alignItems="center">
          <YStack flex={1} gap="$1">
            {isEditing ? (
              // Show search input when editing
              <ExerciseSearchInput
                value={selectedExercise}
                onSelect={setSelectedExercise}
                placeholder="Search exercises..."
              />
            ) : (
              // Show exercise name normally
              <>
                <Text
                  fontSize="$5"
                  fontWeight="600"
                  color={isActive ? "$color" : "$textMuted"}
                >
                  {exercise.name}
                </Text>
                {!isExpanded && (
                  <Text
                    fontSize="$2"
                    color={isActive ? "$textSoft" : "$textMuted"}
                  >
                    {completedSets}/{totalSets} sets completed
                  </Text>
                )}
              </>
            )}
          </YStack>

          <XStack gap="$2" alignItems="center">
            {/* Edit/Save Button - only show when collapsed and active */}
            {!isExpanded && isActive && (
              <Stack
                paddingHorizontal="$2"
                paddingVertical="$1"
                borderRadius="$2"
                backgroundColor="transparent"
                pressStyle={{ backgroundColor: "$backgroundPress" }}
                onPress={isEditing ? handleSavePress : handleEditPress}
                cursor="pointer"
              >
                <Text fontSize="$2" color="$textSoft" fontWeight="500">
                  {isEditing ? "Save" : "Edit"}
                </Text>
              </Stack>
            )}

            {/* Chevron/Delete Button */}
            <Stack
              onPress={isEditing ? handleDelete : undefined}
              cursor={isEditing ? "pointer" : "default"}
            >
              {isEditing ? (
                <Ionicons
                  name="close"
                  size={20}
                  color="#ef4444" // Red color for delete
                />
              ) : (
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
              )}
            </Stack>
          </XStack>
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
