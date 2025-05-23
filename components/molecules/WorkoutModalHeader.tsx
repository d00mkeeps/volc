import React from "react";
import { Stack, Text, YStack, Button } from "tamagui";

interface WorkoutModalHeaderProps {
  countdownTime: string; // Format: "HH:MM:SS"
  workoutName: string;
  workoutDescription: string;
  onStartWorkout: () => void;
  isActive?: boolean; // For future active state
}

export default function WorkoutModalHeader({
  countdownTime,
  workoutName,
  workoutDescription,
  onStartWorkout,
  isActive = false,
}: WorkoutModalHeaderProps) {
  return (
    <YStack gap="$3" paddingVertical="$5">
      {/* Countdown Timer - Prominent */}
      <Stack alignItems="center">
        <Text
          fontSize="$10"
          fontWeight="bold"
          color="$color"
          fontFamily="$heading"
        >
          {countdownTime}
        </Text>
      </Stack>

      {/* Workout Info */}
      <YStack gap="$1.5" alignItems="center">
        <Text fontSize="$6" fontWeight="600" color="$color" textAlign="center">
          {workoutName}
        </Text>
        <Text
          fontSize="$4"
          color="$textSoft"
          textAlign="center"
          paddingHorizontal="$4"
        >
          {workoutDescription}
        </Text>
      </YStack>

      {/* START Button */}
      <Stack alignItems="center" marginTop="$3">
        <Button
          size="$5"
          backgroundColor="$primary"
          color="white"
          fontWeight="bold"
          paddingHorizontal="$8"
          onPress={onStartWorkout}
          pressStyle={{
            backgroundColor: "$primaryLight",
          }}
        >
          START
        </Button>
      </Stack>
    </YStack>
  );
}
