import React, { useState, useEffect } from "react";
import { YStack, Text, Input, Button, TextArea, Card } from "tamagui";
import { useUserSessionStore } from "@/stores/userSessionStore";

interface WorkoutSummarySlideProps {
  onContinue: () => void;
  showContinueButton?: boolean;
}

export function WorkoutSummarySlide({
  onContinue,
  showContinueButton = true,
}: WorkoutSummarySlideProps) {
  const { currentWorkout, updateCurrentWorkout } = useUserSessionStore();
  const [workoutName, setWorkoutName] = useState(currentWorkout?.name || "");
  const [workoutNotes, setWorkoutNotes] = useState(() => {
    // Pre-populate with exercise headings if no existing notes
    if (currentWorkout?.notes) {
      return currentWorkout.notes;
    }

    return (
      currentWorkout?.workout_exercises
        ?.map((exercise) => `--- ${exercise.name} ---\n\n`)
        .join("\n") || ""
    );
  });

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

  const handleContinue = () => {
    console.log("=== SUMMARY SLIDE CONTINUE ===");
    console.log("Workout name:", workoutName);
    console.log("Workout notes:", workoutNotes);
    console.log("Workout notes length:", workoutNotes.length);

    if (currentWorkout) {
      const updatedWorkout = {
        ...currentWorkout,
        name: workoutName,
        notes: workoutNotes,
        updated_at: new Date().toISOString(),
      };

      console.log("About to update workout with:", {
        id: updatedWorkout.id,
        name: updatedWorkout.name,
        notes: updatedWorkout.notes,
        notesLength: updatedWorkout.notes?.length,
      });

      updateCurrentWorkout(updatedWorkout);
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

        <TextArea
          value={workoutNotes}
          onChangeText={setWorkoutNotes}
          placeholder="Add notes for your workout..."
          minHeight={200}
          backgroundColor="$background"
        />
      </YStack>

      {showContinueButton && (
        <Button size="$4" backgroundColor="$primary" onPress={handleContinue}>
          Continue to Coach
        </Button>
      )}
    </YStack>
  );
}
