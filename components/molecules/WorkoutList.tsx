import React from "react";
import { Stack, Text, ScrollView } from "tamagui";

export default function WorkoutList() {
  return (
    <Stack marginBottom="$4">
      <Text fontSize="$4" fontWeight="500" color="$text" marginBottom="$2">
        Workouts
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Stack flexDirection="row" gap="$3">
          <Stack
            width={120}
            height={80}
            backgroundColor="$backgroundSoft"
            borderRadius="$3"
          />
          <Stack
            width={120}
            height={80}
            backgroundColor="$backgroundSoft"
            borderRadius="$3"
          />
          <Stack
            width={120}
            height={80}
            backgroundColor="$backgroundSoft"
            borderRadius="$3"
          />
        </Stack>
      </ScrollView>
    </Stack>
  );
}
