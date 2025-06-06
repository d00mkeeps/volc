import WorkoutList from "@/components/molecules/workout/WorkoutList";
import React from "react";
import { Stack, Text } from "tamagui";

export default function WorkoutScreen() {
  return (
    <Stack flex={1} backgroundColor="$background">
      {/* Header */}
      <Stack
        padding="$4"
        backgroundColor="$backgroundStrong"
        borderBottomWidth={1}
        borderBottomColor="$borderSoft"
      >
        <Text fontSize="$7" fontWeight="bold" color="$color">
          Workouts
        </Text>
        <Text fontSize="$4" color="$textMuted">
          Your training history
        </Text>
      </Stack>

      <Stack padding="$4" flex={1}>
        <WorkoutList limit={10} />
      </Stack>
    </Stack>
  );
}
