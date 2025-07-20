import React, { useState, useRef, useEffect } from "react";
import { YStack, Text, Input, Button, TextArea, Card } from "tamagui";
import { useUserSessionStore } from "@/stores/userSessionStore";

interface WorkoutSummarySlideProps {
  onContinue: () => void;
  showContinueButton?: boolean; // Add this prop
}

export function WorkoutSummarySlide({
  onContinue,
  showContinueButton = true,
}: WorkoutSummarySlideProps) {
  const { currentWorkout, updateCurrentWorkout } = useUserSessionStore();
  const [workoutName, setWorkoutName] = useState(currentWorkout?.name || "");
  const notesRef = useRef<Record<number, string>>({});

  // Initialize notes ref with existing notes
  useEffect(() => {
    currentWorkout?.workout_exercises?.forEach((exercise, index) => {
      if (exercise.notes) {
        notesRef.current[index] = exercise.notes;
      }
    });
  }, [currentWorkout]);

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
    notesRef.current[exerciseIndex] = notes;
  };

  const handleContinue = () => {
    if (currentWorkout) {
      const updatedExercises = currentWorkout.workout_exercises.map((exercise, index) => ({
        ...exercise,
        notes: notesRef.current[index] || exercise.notes || ""
      }));

      updateCurrentWorkout({
        ...currentWorkout,
        workout_exercises: updatedExercises,
        updated_at: new Date().toISOString(),
      });
    }
    
    onContinue();
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
                  defaultValue={exercise.notes || ""}
                  onChangeText={(notes) => handleNotesChange(index, notes)}
                  minHeight={80}
                  backgroundColor="$background"
                />
              </YStack>
            </Card>
          )) || <Text color="$textMuted">No exercises found</Text>}
        </YStack>
      </YStack>

      {showContinueButton && (
        <Button size="$4" backgroundColor="$primary" onPress={handleContinue}>
          Continue to Coach
        </Button>
      )}
    </YStack>
  );
}
