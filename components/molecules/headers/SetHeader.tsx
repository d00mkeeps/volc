import React from "react";
import { XStack, Stack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import { ExerciseDefinition } from "@/types/workout";
import { useUserStore } from "@/stores/userProfileStore";

interface SetHeaderProps {
  isActive: boolean;
  exerciseDefinition?: ExerciseDefinition;
}

export default function SetHeader({
  isActive,
  exerciseDefinition,
}: SetHeaderProps) {
  const { userProfile } = useUserStore();
  const isImperial = userProfile?.is_imperial ?? false;
  const weightUnit = isImperial ? "lbs" : "kg";
  const distanceUnit = isImperial ? "mi" : "km";

  const showWeight = exerciseDefinition?.uses_weight ?? true;
  const showReps = exerciseDefinition?.uses_reps ?? true;
  const showDistance = exerciseDefinition?.uses_distance ?? false;
  const showDuration = exerciseDefinition?.uses_duration ?? false;

  const renderHeaders = () => {
    const headers = [];
    if (showWeight)
      headers.push(
        <Stack key="weight" flex={1} alignItems="center">
          <Text
            size="medium"
            fontWeight="600"
            color={isActive ? "$color" : "$textSoft"}
          >
            {weightUnit}
          </Text>
        </Stack>
      );
    if (showReps)
      headers.push(
        <Stack key="reps" flex={1} alignItems="center">
          <Text
            size="medium"
            fontWeight="600"
            color={isActive ? "$color" : "$textSoft"}
          >
            reps
          </Text>
        </Stack>
      );
    if (showDistance)
      headers.push(
        <Stack key="distance" flex={1} alignItems="center">
          <Text
            size="medium"
            fontWeight="600"
            color={isActive ? "$color" : "$textSoft"}
          >
            {distanceUnit}
          </Text>
        </Stack>
      );
    if (showDuration)
      headers.push(
        <Stack key="duration" flex={1} alignItems="center">
          <Text
            size="medium"
            fontWeight="600"
            color={isActive ? "$color" : "$textSoft"}
          >
            time
          </Text>
        </Stack>
      );
    return headers;
  };

  return (
    <XStack alignItems="center" paddingBottom="$1">
      <Stack width={50} alignItems="center">
        <Text
          size="medium"
          fontWeight="600"
          color={isActive ? "$color" : "$textSoft"}
        >
          set
        </Text>
      </Stack>
      <XStack flex={1}>{renderHeaders()}</XStack>
      <Stack width={55} />
    </XStack>
  );
}
