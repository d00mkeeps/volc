import React from "react";
import { Button, Text } from "tamagui";

interface CreateNewButtonProps {
  onPress?: () => void;
}

export default function CreateNewButton({ onPress }: CreateNewButtonProps) {
  return (
    <Button
      position="absolute"
      bottom="$6"
      right="$4"
      width={72}
      height={72}
      borderRadius="$4"
      backgroundColor="$primary"
      pressStyle={{ backgroundColor: "$primaryLight" }}
      onPress={onPress}
    >
      <Text color="white" fontSize={42} fontWeight="300">
        +
      </Text>
    </Button>
  );
}
