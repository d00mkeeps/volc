import WorkoutList from "@/components/molecules/WorkoutList";
import React from "react";
import { Stack, Text } from "tamagui";

export default function ChatScreen() {
  return (
    <Stack flex={1} backgroundColor="$background" padding="$4">
      <Text>Chat Screen</Text>
      <WorkoutList />
    </Stack>
  );
}
