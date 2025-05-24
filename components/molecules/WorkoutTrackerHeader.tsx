import React from "react";
import { YStack, XStack, Text, Stack } from "tamagui";
import { Ionicons } from "@expo/vector-icons";

interface WorkoutTrackerHeaderProps {
  workoutName: string;
  workoutDescription?: string;
  isActive: boolean;
  timeString: string;
  isPaused: boolean;
  togglePause: () => void;
}

export default function WorkoutTrackerHeader({
  workoutName,
  workoutDescription,
  isActive,
  timeString,
  isPaused,
  togglePause,
}: WorkoutTrackerHeaderProps) {
  const handleNotesPress = () => {
    console.log("Opening notes interface");
  };

  return (
    <YStack
      padding="$4"
      gap="$3"
      backgroundColor="$backgroundSoft"
      borderBottomWidth={1}
      borderBottomColor="$borderSoft"
    >
      {/* Timer */}
      <XStack justifyContent="center" alignItems="center">
        <Text
          fontSize="$10"
          fontWeight="bold"
          color="$color"
          fontFamily="$heading"
        >
          {timeString}
        </Text>
      </XStack>

      {/* Bottom row with buttons and workout info */}
      <XStack alignItems="center" justifyContent="space-between" width="100%">
        {/* Notes button - left side */}
        <Stack
          width={40}
          height={40}
          backgroundColor={isActive ? "$primaryLight" : "$backgroundSoft"}
          borderRadius="$3"
          justifyContent="center"
          alignItems="center"
          pressStyle={
            isActive
              ? {
                  backgroundColor: "$backgroundPress",
                }
              : {}
          }
          onPress={isActive ? handleNotesPress : undefined}
          opacity={isActive ? 1 : 0.4}
          animation="medium"
        >
          <Ionicons
            name="document-text-outline"
            size={20}
            color={isActive ? "$color" : "$textSoft"}
          />
        </Stack>

        {/* Center - Workout Info */}
        <YStack gap="$1.5" alignItems="center" flex={1} paddingHorizontal="$3">
          <Text
            fontSize="$6"
            fontWeight="600"
            color="$color"
            textAlign="center"
            animation="quick"
          >
            {workoutName}
          </Text>

          {workoutDescription && (
            <Text
              fontSize="$4"
              color="$textSoft"
              textAlign="center"
              animation="medium"
            >
              {workoutDescription}
            </Text>
          )}

          {/* Status indicators - always shown */}
          <XStack gap="$1.5" alignItems="center">
            {!isActive ? (
              <>
                <Stack
                  width={8}
                  height={8}
                  borderRadius={4}
                  backgroundColor="$textSoft"
                  animation="quick"
                />
                <Text fontSize="$3" color="$textSoft">
                  Workout not started
                </Text>
              </>
            ) : isPaused ? (
              <>
                <Stack
                  width={8}
                  height={8}
                  borderRadius={4}
                  backgroundColor="$yellow8"
                  animation="quick"
                />
                <Text fontSize="$3" color="$textSoft">
                  Workout paused
                </Text>
              </>
            ) : (
              <>
                <Stack
                  width={8}
                  height={8}
                  borderRadius={4}
                  backgroundColor="$primary"
                  animation="quick"
                />
                <Text fontSize="$3" color="$textSoft">
                  Workout in progress
                </Text>
              </>
            )}
          </XStack>
        </YStack>

        {/* Pause/Play button - right side */}
        <Stack
          width={40}
          height={40}
          backgroundColor={isActive ? "$primaryLight" : "$backgroundSoft"}
          borderRadius="$3"
          justifyContent="center"
          alignItems="center"
          pressStyle={
            isActive
              ? {
                  backgroundColor: "$backgroundPress",
                }
              : {}
          }
          onPress={isActive ? togglePause : undefined}
          opacity={isActive ? 1 : 0.4}
          animation="quick"
        >
          <Ionicons
            name={isPaused ? "play" : "pause"}
            size={20}
            color={isActive ? "$color" : "$textSoft"}
          />
        </Stack>
      </XStack>
    </YStack>
  );
}
