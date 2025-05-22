import React from "react";
import { Stack, Text } from "tamagui";

export default function Dashboard() {
  return (
    <Stack
      flex={1}
      backgroundColor="$backgroundSoft"
      borderRadius="$4"
      padding="$3"
      marginBottom="$4"
      gap="$3"
    >
      <Text fontSize="$5" fontWeight="600" color="$text" marginBottom="$2">
        Dashboard
      </Text>

      <Stack flexDirection="row" flex={1} gap="$3">
        {/* Large card - takes up half */}
        <Stack
          flex={1}
          backgroundColor="$primaryLight"
          borderRadius="$3"
          padding="$3"
        />

        {/* Two smaller cards sharing the other half */}
        <Stack flex={1} gap="$3">
          <Stack
            flex={1}
            backgroundColor="$primaryLight"
            borderRadius="$3"
            padding="$3"
          />
          <Stack
            flex={1}
            backgroundColor="$primaryLight"
            borderRadius="$3"
            padding="$3"
          />
        </Stack>
      </Stack>
    </Stack>
  );
}
