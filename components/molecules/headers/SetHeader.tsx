// atoms/SetHeader.tsx
import React from "react";
import { XStack, Stack } from "tamagui";
import Label from "../../atoms/Label";
interface SetHeaderProps {
  isActive: boolean;
  weightUnit?: string;
}

export default function SetHeader({
  isActive,
  weightUnit = "kg",
}: SetHeaderProps) {
  return (
    <XStack gap="$3" alignItems="center" paddingBottom="$1">
      <Stack width={30} alignItems="center">
        <Label isActive={isActive}>Set</Label>
      </Stack>

      <XStack flex={1} gap="$1.5">
        <Stack flex={1} alignItems="center">
          <Label isActive={isActive} textAlign="center">
            {weightUnit}
          </Label>
        </Stack>
        <Stack flex={1} alignItems="center">
          <Label isActive={isActive} textAlign="center">
            reps
          </Label>
        </Stack>
      </XStack>

      <Stack width={40} alignItems="center">
        <Label isActive={isActive} textAlign="center">
          ✓
        </Label>
      </Stack>
    </XStack>
  );
}
