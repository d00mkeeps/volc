import React, { useState } from "react";
import { Stack, YStack, XStack, Text, Separator } from "tamagui";
import { Ionicons } from "@expo/vector-icons";
import SetRow from "./SetRow";
import { WorkoutExercise, WorkoutExerciseSet } from "@/types/workout";
import { Alert } from "react-native";
import ExerciseSearchInput from "./ExerciseSearchInput";
import ExerciseTrackerHeader from "../headers/ExerciseTrackerHeader";
import { useExerciseStore } from "@/stores/workout/exerciseStore";
import NewSetButton from "../../atoms/buttons/NewSetButton";
import SetHeader from "../headers/SetHeader";
import NotesModal from "./NotesModal";

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
  onExerciseDelete,
  startInEditMode,
}: ExerciseTrackerProps) {
  const [isExpanded, setIsExpanded] = useState(isInitiallyExpanded);
  const [isEditing, setIsEditing] = useState(
    startInEditMode || exercise.name === ""
  );
  const [selectedExercise, setSelectedExercise] = useState(exercise.name);
  const [notesModalVisible, setNotesModalVisible] = useState(false);

  const completedSets = exercise.workout_exercise_sets.filter(
    (set) => set.is_completed
  ).length;
  const totalSets = exercise.workout_exercise_sets.length;

  const hasExerciseData =
    exercise.workout_exercise_sets.length > 0 &&
    (exercise.workout_exercise_sets[0].weight !== undefined ||
      exercise.workout_exercise_sets[0].reps !== undefined ||
      exercise.workout_exercise_sets[0].is_completed);

  const toggleExpanded = () => {
    if (!isActive || isEditing) return;
    setIsExpanded(!isExpanded);
  };

  const handleEditPress = () => {
    setIsEditing(true);
    setSelectedExercise(exercise.name);
  };

  const handleNotesPress = () => setNotesModalVisible(true);

  const handleNotesSave = (notes: string) => {
    if (!onExerciseUpdate) return;
    onExerciseUpdate({ ...exercise, notes });
  };

  const handleSavePress = () => {
    if (!onExerciseUpdate) return;

    const { exercises } = useExerciseStore.getState();
    const selectedDefinition = exercises.find(
      (ex) => ex.standard_name === selectedExercise
    );

    const updatedExercise = {
      ...exercise,
      name: selectedExercise,
      definition_id: selectedDefinition?.id,
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
      onExerciseDelete(exercise.id);
    }
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
    <>
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
          onPress={isEditing ? undefined : toggleExpanded}
          pressStyle={
            isActive && !isEditing
              ? {
                  backgroundColor: "$backgroundPress",
                }
              : undefined
          }
          cursor={isActive && !isEditing ? "pointer" : "default"}
        >
          {isEditing ? (
            <ExerciseSearchInput
              value={selectedExercise}
              onSelect={setSelectedExercise}
              placeholder="Search exercises..."
            />
          ) : (
            <>
              <ExerciseTrackerHeader
                hasNotes={!!exercise.notes}
                exerciseName={exercise.name}
                isActive={isActive}
                isEditing={false}
                isExpanded={isExpanded}
                onEditPress={handleEditPress}
                onNotesPress={handleNotesPress}
                onToggleExpanded={toggleExpanded}
                onDelete={handleDelete}
                onSave={handleSavePress}
              />
              {!isExpanded && (
                <Text fontSize="$2" color={"$textSoft"} marginTop="$1">
                  {completedSets}/{totalSets} sets completed
                </Text>
              )}
            </>
          )}

          {isEditing && (
            <XStack justifyContent="flex-end" gap="$2" marginTop="$2">
              <Stack
                paddingHorizontal="$2"
                paddingVertical="$1"
                borderRadius="$2"
                backgroundColor="transparent"
                pressStyle={{ backgroundColor: "$backgroundPress" }}
                onPress={handleSavePress}
                cursor="pointer"
              >
                <Text fontSize="$2" color="$textSoft" fontWeight="500">
                  Save
                </Text>
              </Stack>
              <Stack onPress={handleDelete} cursor="pointer">
                <Ionicons name="close" size={20} color="#ef4444" />
              </Stack>
            </XStack>
          )}
        </Stack>

        {/* Expanded Content */}
        {isExpanded && (
          <>
            <Separator marginHorizontal="$3" borderColor="$borderSoft" />

            <YStack padding="$1.5" gap="$1.5">
              <SetHeader
                isActive={isActive}
                weightUnit={exercise.weight_unit}
              />

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

              <NewSetButton isActive={isActive} onPress={handleAddSet} />
            </YStack>
          </>
        )}
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
