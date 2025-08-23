import React, { useState } from "react";
import { Stack, YStack, XStack, Text, Separator } from "tamagui";
import { Ionicons } from "@expo/vector-icons";
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
import NewSetButton from "../../atoms/buttons/NewSetButton";
import SetHeader from "../headers/SetHeader";
import NotesModal from "./NotesModal";

interface ExerciseTrackerProps {
  exercise: WorkoutExercise;
  isActive?: boolean;
  onExerciseUpdate?: (updatedExercise: WorkoutExercise) => void;
  onExerciseDelete?: (exerciseId: string) => void;
  startInEditMode?: boolean;
}

export default function ExerciseTracker({
  exercise,
  isActive = true,
  onExerciseUpdate,
  onExerciseDelete,
  startInEditMode,
}: ExerciseTrackerProps) {
  const [isEditing, setIsEditing] = useState(
    startInEditMode || exercise.name === ""
  );
  const [selectedExercise, setSelectedExercise] = useState(exercise.name);
  const [notesModalVisible, setNotesModalVisible] = useState(false);

  const { exercises } = useExerciseStore();
  const exerciseDefinition = exercises.find(
    (ex: ExerciseDefinition) => ex.id === exercise.definition_id
  );

  const handleEditPress = () => {
    setIsEditing(true);
    setSelectedExercise(exercise.name);
  };

  const handleNotesPress = () => setNotesModalVisible(true);

  const handleNotesSave = (notes: string) => {
    if (!onExerciseUpdate) return;
    onExerciseUpdate({ ...exercise, notes });
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
    };

    onExerciseUpdate(updatedExercise);
    setIsEditing(false);
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
      // is_completed removed - not using anymore
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
        <Stack paddingHorizontal="$3" paddingVertical="$1.5">
          {isEditing ? (
            <ExerciseSearchInput
              value={selectedExercise}
              onSelect={handleExerciseSelect}
              placeholder="Search exercises..."
            />
          ) : (
            <ExerciseTrackerHeader
              hasNotes={!!exercise.notes}
              exerciseName={exercise.name}
              isActive={isActive}
              isEditing={false}
              onEditPress={handleEditPress}
              onNotesPress={handleNotesPress}
              onDelete={handleDelete}
              onSave={() => {}}
            />
          )}

          {isEditing && (
            <XStack justifyContent="flex-end" gap="$2" marginTop="$2">
              <Stack onPress={handleDelete} cursor="pointer">
                <Ionicons name="close" size={20} color="#ef4444" />
              </Stack>
            </XStack>
          )}
        </Stack>

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
              />
            ))}
          {isActive && isSetLimitReached && (
            <Text
              color="$textMuted"
              fontSize="$3"
              textAlign="center"
              marginTop="$1"
            >
              Set limit reached (10/10)
            </Text>
          )}
          <NewSetButton
            isActive={isActive && !isSetLimitReached}
            onPress={handleAddSet}
          />
        </YStack>
      </YStack>

      <NotesModal
        isVisible={notesModalVisible}
        exerciseName={exercise.name}
        initialNotes={exercise.notes || ""}
        onSave={handleNotesSave}
        onClose={() => setNotesModalVisible(false)}
      />
    </>
  );
}
