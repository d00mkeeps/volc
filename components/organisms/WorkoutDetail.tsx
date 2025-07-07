import React, { useState, useEffect } from "react";
import { YStack, XStack, Text, ScrollView, Button, Stack } from "tamagui";
import { Modal } from "react-native";
import ExerciseTracker from "@/components/molecules/workout/ExerciseTracker";
import { CompleteWorkout, WorkoutExercise, WorkoutExerciseSet } from "@/types/workout";
import { useWorkoutStore } from "@/stores/workout/WorkoutStore";

interface WorkoutDetailProps {
  workoutId: string;
  visible: boolean;
  onClose: () => void;
}

export default function WorkoutDetail({ workoutId, visible, onClose }: WorkoutDetailProps) {
  const [workout, setWorkout] = useState<CompleteWorkout | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { getWorkout, updateWorkout } = useWorkoutStore();

  useEffect(() => {
    if (visible && workoutId) {
      loadWorkout();
    }
  }, [visible, workoutId]);

  const loadWorkout = async () => {
    try {
      setLoading(true);
      await getWorkout(workoutId);
      const loadedWorkout = useWorkoutStore.getState().currentWorkout;
      console.log('Loaded workout:', JSON.stringify(loadedWorkout, null, 2));
      setWorkout(loadedWorkout);
    } catch (error) {
      console.error("Failed to load workout:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExerciseUpdate = (updatedExercise: WorkoutExercise) => {
    if (!workout) return;
    
    const updatedWorkout = {
      ...workout,
      workout_exercises: workout.workout_exercises.map(ex =>
        ex.id === updatedExercise.id ? updatedExercise : ex
      )
    };
    setWorkout(updatedWorkout);
  };

  const handleSave = async () => {
    if (!workout) return;
    
    try {
      setSaving(true);
      await updateWorkout(workout.id, {
        name: workout.name,
        description: workout.notes,
        exercises: workout.workout_exercises.map(ex => ({
          exercise_name: ex.name,
          definition_id: ex.definition_id,
          set_data: {
            sets: ex.workout_exercise_sets.map((set: WorkoutExerciseSet) => ({
              weight: set.weight,
              reps: set.reps,
              distance: set.distance,
              duration: set.duration,
              rpe: set.rpe
            }))
          },
          order_in_workout: ex.order_index,
          weight_unit: ex.weight_unit,
          distance_unit: ex.distance_unit
        }))
      });
      onClose();
    } catch (error) {
      console.error("Failed to save workout:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <YStack flex={1} backgroundColor="$background">
        <XStack
          padding="$4"
          backgroundColor="$backgroundStrong"
          borderBottomWidth={1}
          borderBottomColor="$borderSoft"
          alignItems="center"
          justifyContent="space-between"
        >
          <Button size="$3" variant="outlined" onPress={onClose} disabled={saving}>
            Cancel
          </Button>
          
          <YStack alignItems="center">
            <Text fontSize="$5" fontWeight="600" color="$color">
              {workout?.name || "Workout"}
            </Text>
            <Text fontSize="$3" color="$textSoft">
              {workout?.created_at ? new Date(workout.created_at).toLocaleDateString() : ""}
            </Text>
          </YStack>
          
          <Button size="$3" backgroundColor="$primary" onPress={handleSave} disabled={saving || loading}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </XStack>

        {loading ? (
          <YStack flex={1} justifyContent="center" alignItems="center">
            <Text color="$textSoft">Loading workout...</Text>
          </YStack>
        ) : (
          <ScrollView flex={1} padding="$4">
            <YStack gap="$3">
              {workout?.workout_exercises
                .sort((a, b) => a.order_index - b.order_index)
                .map((exercise) => (
                  <ExerciseTracker
                    key={exercise.id}
                    exercise={exercise}
                    
                    isActive={true}
                    onExerciseUpdate={handleExerciseUpdate}
                    onExerciseDelete={() => {}}
                    startInEditMode={false}
                  />
                ))}

              {(!workout?.workout_exercises || workout.workout_exercises.length === 0) && (
                <YStack
                  padding="$5"
                  alignItems="center"
                  backgroundColor="$backgroundSoft"
                  borderRadius="$3"
                >
                  <Text fontSize="$4" color="$textSoft" textAlign="center">
                    No exercises in this workout
                  </Text>
                </YStack>
              )}
            </YStack>
          </ScrollView>
        )}
      </YStack>
    </Modal>
  );
}