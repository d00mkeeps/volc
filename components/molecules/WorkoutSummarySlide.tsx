// components/WorkoutSummarySlide.tsx
import React, { useState } from "react";
import { YStack, Text, Input, Button, ScrollView } from "tamagui";
import { CompleteWorkout } from "@/types/workout";

interface WorkoutSummarySlideProps {
  workout: CompleteWorkout | null;
  onContinue: () => void;
}

export function WorkoutSummarySlide({
  workout,
  onContinue,
}: WorkoutSummarySlideProps) {
  const [workoutName, setWorkoutName] = useState(workout?.name || "");

  // Group notes by exercise
  const exerciseNotes =
    workout?.workout_exercises
      .filter((ex) => ex.notes)
      .map((ex) => ({
        name: ex.name,
        notes: ex.notes,
      })) || [];

  return (
    <YStack f={1} gap="$4">
      <Text fontSize="$6" fontWeight="bold">
        Workout Complete!
      </Text>

      <Input
        value={workoutName}
        onChangeText={setWorkoutName}
        placeholder={workout?.name || "Name your workout..."}
        placeholderTextColor="$textMuted"
        size="$4"
      />

      <YStack f={1}>
        <Text fontSize="$5" fontWeight="600" marginBottom="$2">
          Notes
        </Text>
        <ScrollView f={1} showsVerticalScrollIndicator={false}>
          <YStack gap="$3">
            {exerciseNotes.length > 0 ? (
              exerciseNotes.map((item, index) => (
                <YStack key={index} gap="$1">
                  <Text fontSize="$3" fontWeight="600">
                    {item.name}
                  </Text>
                  <Text fontSize="$3" color="$textSoft">
                    {item.notes}
                  </Text>
                </YStack>
              ))
            ) : (
              <Text color="$textMuted">No notes for this workout</Text>
            )}
          </YStack>
        </ScrollView>
      </YStack>

      <Button size="$4" backgroundColor="$primary" onPress={onContinue}>
        Continue to Coach
      </Button>
    </YStack>
  );
}
