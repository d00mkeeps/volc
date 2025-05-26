import React from "react";
import { Stack, Text } from "tamagui";

export default function ProfileScreen() {
  return (
    <Stack
      flex={1}
      backgroundColor="$background"
      justifyContent="center"
      alignItems="center"
    >
      <Text fontSize="$6" color="$color">
        Profile Screen
      </Text>
      <Text fontSize="$3" color="$textSoft">
        Coming soon...
      </Text>
    </Stack>
  );
}
