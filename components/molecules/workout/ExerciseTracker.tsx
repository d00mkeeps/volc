import React, { useState } from "react";
import { Stack, YStack, XStack, Separator } from "tamagui";
import Text from "@/components/atoms/core/Text";
import Button from "@/components/atoms/core/Button";
import SetRow from "./SetRow";
import {
  WorkoutExercise,
  WorkoutExerciseSet,
  ExerciseDefinition,
} from "@/types/workout";
import { Alert } from "react-native";
import ExerciseSearchInput from "./ExerciseSearchInput";
import ExerciseTrackerHeader from "../headers/ExerciseTrackerHeader";
import { useExerciseStore } from "@/stores/workout/exerciseStore";
import SetHeader from "../headers/SetHeader";
import ExerciseDefinitionView from "./ExerciseDefinitionView";
import { useUserSessionStore } from "@/stores/userSessionStore";
import TextEditModal from "../core/TextEditModal";

interface ExerciseTrackerProps {
  exercise: WorkoutExercise;
  isActive?: boolean;
  onExerciseUpdate?: (updatedExercise: WorkoutExercise) => void;
  onExerciseDelete?: (exerciseId: string) => void;
  startInEditMode?: boolean;
  onEditingChange?: (isEditing: boolean) => void;
}

export default function ExerciseTracker({
  exercise,
  isActive = true,
  onExerciseUpdate,
  onExerciseDelete,
  onEditingChange,
  startInEditMode,
}: ExerciseTrackerProps) {
  const [isEditing, setIsEditing] = useState(
    startInEditMode || exercise.name === ""
  );
  const [selectedExercise, setSelectedExercise] = useState(exercise.name);
  const [definitionModalVisible, setDefinitionModalVisible] = useState(false);

  const { exercises } = useExerciseStore();
  const { currentWorkout } = useUserSessionStore();

  const [notesModalVisible, setNotesModalVisible] = useState(false);

  const exerciseDefinition = exercises.find(
    (ex: ExerciseDefinition) => ex.id === exercise.definition_id
  );

  const handleCancelEdit = () => {
    if (exercise.name) {
      // Existing exercise: revert to original name
      setIsEditing(false);
      setSelectedExercise(exercise.name);
      onEditingChange?.(false); // Notify parent
    } else {
      // New exercise: delete completely
      if (onExerciseDelete) {
        onExerciseDelete(exercise.id);
        onEditingChange?.(false); // Notify parent
      }
    }
  };

  const handleNotesLongPress = () => {
    if (!isActive) return;
    setNotesModalVisible(true);
  };

  const handleNotesSave = (notes: string) => {
    if (!onExerciseUpdate) return;

    const updatedExercise = {
      ...exercise,
      notes: notes || undefined, // Set to undefined if empty
    };

    onExerciseUpdate(updatedExercise);
  };

  const handleEditPress = () => {
    setIsEditing(true);
    setSelectedExercise(exercise.name);
    onEditingChange?.(true);
  };

  const namedExercisesCount =
    currentWorkout?.workout_exercises.filter((ex) => ex.name).length || 0;

  const canDeleteExercise = exercise.name
    ? namedExercisesCount > 1
    : namedExercisesCount >= 1;
  const canCancelEdit = canDeleteExercise || !!exercise.name;

  const handleShowDefinition = () => {
    if (exercise.definition_id) {
      setDefinitionModalVisible(true);
    }
  };

  const handleExerciseSelect = (exerciseName: string) => {
    if (!onExerciseUpdate) return;

    const selectedDefinition = exercises.find(
      (ex: ExerciseDefinition) => ex.standard_name === exerciseName
    );

    const updatedExercise = {
      ...exercise,
      name: exerciseName,
      definition_id: selectedDefinition?.id,
      notes: undefined, // CLEAR NOTES when exercise changes
    };

    onExerciseUpdate(updatedExercise);
    setIsEditing(false);
    onEditingChange?.(false);
  };

  const handleDelete = () => {
    if (!onExerciseDelete) return;

    const hasExerciseData =
      exercise.workout_exercise_sets.length > 0 &&
      (exercise.workout_exercise_sets[0].weight !== undefined ||
        exercise.workout_exercise_sets[0].reps !== undefined);

    if (hasExerciseData) {
      Alert.alert(
        "Delete Exercise",
        `Remove ${exercise.name} and all set data from workout?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => onExerciseDelete(exercise.id),
          },
        ]
      );
    } else {
      onExerciseDelete(exercise.id);
    }
  };

  const handleSetDelete = (setId: string) => {
    if (!isActive || !onExerciseUpdate) return;

    // Prevent deleting the last set
    if (exercise.workout_exercise_sets.length <= 1) {
      Alert.alert(
        "Cannot Delete Set",
        "Each exercise must have at least one set. Delete the entire exercise instead if needed.",
        [{ text: "OK" }]
      );
      return;
    }

    const updatedSets = exercise.workout_exercise_sets
      .filter((set) => set.id !== setId)
      .map((set, index) => ({
        ...set,
        set_number: index + 1, // Renumber sets
      }));

    const updatedExercise = {
      ...exercise,
      workout_exercise_sets: updatedSets,
    };

    onExerciseUpdate(updatedExercise);
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

    const lastSet =
      exercise.workout_exercise_sets[exercise.workout_exercise_sets.length - 1];

    const newSet: WorkoutExerciseSet = {
      id: `set-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      exercise_id: exercise.id,
      set_number: exercise.workout_exercise_sets.length + 1,
      weight: lastSet?.weight || undefined,
      reps: lastSet?.reps || undefined,
      distance: lastSet?.distance || undefined,
      duration: lastSet?.duration || undefined,
      rpe: lastSet?.rpe || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedExercise = {
      ...exercise,
      workout_exercise_sets: [...exercise.workout_exercise_sets, newSet],
    };

    onExerciseUpdate(updatedExercise);
  };

  const isSetLimitReached = exercise.workout_exercise_sets.length >= 10;

  return (
    <>
      <YStack
        backgroundColor={isActive ? "$backgroundSoft" : "$backgroundMuted"}
        borderRadius="$3"
        overflow="hidden"
        opacity={isActive ? 1 : 0.6}
      >
        <Stack paddingHorizontal="$3" paddingVertical="$2">
          {/* Always render the header */}
          <ExerciseTrackerHeader
            exerciseName={exercise.name}
            isEditing={isEditing}
            onCancelEdit={handleCancelEdit}
            canCancelEdit={canCancelEdit}
            isActive={isActive}
            onNotesLongPress={handleNotesLongPress} // ADD THIS
            onEditPress={handleEditPress}
            exerciseNotes={exercise.notes}
            onDelete={handleDelete}
            onShowDefinition={
              exercise.definition_id ? handleShowDefinition : undefined
            }
            canDelete={canDeleteExercise}
          />

          {/* Show search input below header when editing */}
          {isEditing && (
            <ExerciseSearchInput
              value={selectedExercise}
              onSelect={handleExerciseSelect}
              placeholder="Search exercises..."
              isReplacing={!!exercise.name}
            />
          )}
        </Stack>

        {!isEditing && (
          <>
            <Separator marginHorizontal="$3" borderColor="$borderSoft" />

            <YStack padding="$1.5" gap="$1.5">
              <SetHeader
                isActive={isActive}
                exerciseDefinition={exerciseDefinition}
                weightUnit={exercise.weight_unit}
                distanceUnit={exercise.distance_unit}
              />

              {exercise.workout_exercise_sets
                .sort((a, b) => a.set_number - b.set_number)
                .map((set) => (
                  <SetRow
                    key={set.id}
                    set={set}
                    exerciseDefinition={exerciseDefinition}
                    weightUnit={exercise.weight_unit}
                    distanceUnit={exercise.distance_unit}
                    isActive={isActive}
                    onDelete={handleSetDelete}
                    onUpdate={handleSetUpdate}
                    canDelete={exercise.workout_exercise_sets.length > 1}
                  />
                ))}

              {isActive && isSetLimitReached && (
                <Text
                  color="$textMuted"
                  size="medium"
                  textAlign="center"
                  marginTop="$1"
                >
                  Set limit reached (10/10)
                </Text>
              )}

              {isActive && !isSetLimitReached && (
                <Button
                  size="medium"
                  backgroundColor="$backgroundMuted"
                  borderWidth={1}
                  borderColor="$borderSoft"
                  borderStyle="dashed"
                  color="$primary"
                  alignSelf="center"
                  width="40%"
                  margin="$3"
                  pressStyle={{
                    backgroundColor: "$primaryTint",
                    borderColor: "$primary",
                    scale: 0.98,
                  }}
                  onPress={handleAddSet}
                >
                  <XStack gap="$1.5" alignItems="center">
                    <Text size="medium" color="$primary" fontWeight="600">
                      Add Set
                    </Text>
                  </XStack>
                </Button>
              )}
            </YStack>
          </>
        )}
      </YStack>

      <ExerciseDefinitionView
        definitionId={exercise.definition_id || ""}
        isVisible={definitionModalVisible && !!exercise.definition_id}
        onClose={() => setDefinitionModalVisible(false)}
      />

      <TextEditModal
        isVisible={notesModalVisible}
        onClose={() => setNotesModalVisible(false)}
        currentNotes={exercise.notes}
        onSave={handleNotesSave}
        title={`Notes: ${exercise.name || "Exercise"}`}
      />
    </>
  );
}
