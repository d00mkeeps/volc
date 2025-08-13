import React from "react";
import { Stack, Text } from "tamagui";

interface MuscleData {
  muscle: string;
  sets: number;
}

interface DataStackProps {
  data?: MuscleData[];
}

export default function DataStack({ data }: DataStackProps) {
  return (
    <Stack
      flex={1}
      backgroundColor="#00ff00"
      borderRadius="$2"
      justifyContent="center"
      alignItems="center"
    >
      <Text color="black" fontWeight="600">
        Data Display Area
      </Text>
    </Stack>
  );
}
