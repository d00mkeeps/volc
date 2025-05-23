import React from "react";
import { Stack, YStack, XStack, Text, Button } from "tamagui";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { CompleteWorkout } from "@/types/workout";

interface WorkoutPreviewProps {
  workout: CompleteWorkout;
  countdownTime: string;
  onStartWorkout: () => void;
}

export default function WorkoutPreview({
  workout,
  countdownTime,
  onStartWorkout,
}: WorkoutPreviewProps) {
  const exercises = workout.workout_exercises
    .sort((a, b) => a.order_index - b.order_index)
    .slice(0, 3); // Show only first 3 exercises

  const formatSetInfo = (sets: any[]) => {
    if (!sets || sets.length === 0) return "No sets";
    const firstSet = sets[0];
    if (firstSet.weight && firstSet.reps) {
      return `${sets.length} x ${firstSet.reps} @ ${firstSet.weight}kg`;
    } else if (firstSet.reps) {
      return `${sets.length} x ${firstSet.reps}`;
    } else {
      return `${sets.length} sets`;
    }
  };

  return (
    <Stack
      position="absolute"
      bottom="$4"
      left="$4"
      right="$4"
      backgroundColor="$backgroundSoft"
      borderRadius="$5"
      padding="$4"
    >
      <YStack gap="$4">
        {/* Header with Timer */}
        <YStack gap="$3" alignItems="center">
          <Text
            fontSize="$10"
            fontWeight="bold"
            color="$color"
            fontFamily="$heading"
          >
            {countdownTime}
          </Text>
          <YStack gap="$1.5" alignItems="center">
            <Text
              fontSize="$6"
              fontWeight="600"
              color="$color"
              textAlign="center"
            >
              {workout.name}
            </Text>
            <Text fontSize="$4" color="$textSoft" textAlign="center">
              Ready to crush this workout? Let's go!
            </Text>
          </YStack>
        </YStack>

        {/* Exercise Preview with blur effect */}
        <Stack position="relative" overflow="hidden">
          <YStack gap="$2">
            <Text fontSize="$5" fontWeight="600" color="$color">
              Preview
            </Text>
            {exercises.map((exercise, index) => (
              <XStack
                key={exercise.id}
                justifyContent="space-between"
                alignItems="center"
                paddingVertical="$2"
                paddingHorizontal="$3"
                backgroundColor="$background"
                borderRadius="$3"
              >
                <Text fontSize="$4" color="$color" flex={1}>
                  {exercise.name}
                </Text>
                <Text fontSize="$3" color="$textSoft">
                  {formatSetInfo(exercise.workout_exercise_sets)}
                </Text>
              </XStack>
            ))}
            {workout.workout_exercises.length > 3 && (
              <Text fontSize="$3" color="$textSoft" textAlign="center">
                +{workout.workout_exercises.length - 3} more exercises
              </Text>
            )}
          </YStack>

          <LinearGradient
            colors={[
              "transparent",
              "rgba(0,0,0,0.5)",
              "rgba(0,0,0,0.8)",
              "#000000",
            ]}
            locations={[0, 0.3, 0.7, 1]}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 80,
            }}
          />
        </Stack>

        {/* START Button */}
        <Button
          size="$5"
          backgroundColor="$primary"
          color="white"
          fontWeight="bold"
          onPress={onStartWorkout}
          pressStyle={{
            backgroundColor: "$primaryLight",
          }}
        >
          START
        </Button>
      </YStack>
    </Stack>
  );
}
