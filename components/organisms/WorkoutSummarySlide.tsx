import React, { useState } from "react";
import { YStack, Text, Input, Button, TextArea, Card } from "tamagui";
import { useUserSessionStore } from "@/stores/userSessionStore";

interface WorkoutSummarySlideProps {
  onContinue: () => void;
}

export function WorkoutSummarySlide({ onContinue }: WorkoutSummarySlideProps) {
  const { currentWorkout, updateCurrentWorkout } = useUserSessionStore();
  const [workoutName, setWorkoutName] = useState(currentWorkout?.name || "");

  const handleNameChange = (name: string) => {
    setWorkoutName(name);
    if (currentWorkout) {
      updateCurrentWorkout({
        ...currentWorkout,
        name,
        updated_at: new Date().toISOString(),
      });
    }
  };

  const handleNotesChange = (exerciseIndex: number, notes: string) => {
    if (currentWorkout) {
      const updatedExercises = [...currentWorkout.workout_exercises];
      updatedExercises[exerciseIndex] = {
        ...updatedExercises[exerciseIndex],
        notes,
      };

      updateCurrentWorkout({
        ...currentWorkout,
        workout_exercises: updatedExercises,
        updated_at: new Date().toISOString(),
      });
    }
  };

  return (
    <YStack gap="$4" paddingBottom="$4">
      <Text fontSize="$6" fontWeight="bold">
        Workout Complete!
      </Text>

      <Input
        value={workoutName}
        onChangeText={handleNameChange}
        placeholder={currentWorkout?.name || "Name your workout..."}
        placeholderTextColor="$textMuted"
        size="$4"
      />

      <YStack gap="$2">
        <Text fontSize="$5" fontWeight="600">
          Notes
        </Text>

        <YStack gap="$3">
          {currentWorkout?.workout_exercises?.map((exercise, index) => (
            <Card key={index} padding="$3" backgroundColor="$backgroundSoft">
              <YStack gap="$2">
                <Text fontSize="$4" fontWeight="bold">
                  {exercise.name}
                </Text>
                <TextArea
                  placeholder="Add notes for this exercise..."
                  value={exercise.notes || ""}
                  onChangeText={(notes) => handleNotesChange(index, notes)}
                  minHeight={80}
                  backgroundColor="$background"
                />
              </YStack>
            </Card>
          )) || <Text color="$textMuted">No exercises found</Text>}
        </YStack>
      </YStack>

      <Button size="$4" backgroundColor="$primary" onPress={onContinue}>
        Continue to Coach
      </Button>
    </YStack>
  );
}
