// components/molecules/WorkoutTrackerHeader.tsx
import React from "react";
import { YStack, XStack, Text, Stack } from "tamagui";
import { Ionicons } from "@expo/vector-icons";
import { useWorkoutTimer } from "@/hooks/useWorkoutTimer";

interface WorkoutTrackerHeaderProps {
  workoutName: string;
  workoutDescription?: string;
  scheduledTime?: string; // Format: "HH:MM"
  isActive: boolean;
}

export default function WorkoutTrackerHeader({
  workoutName,
  workoutDescription,
  scheduledTime,
  isActive,
}: WorkoutTrackerHeaderProps) {
  const { timeString, isPaused, togglePause } = useWorkoutTimer({
    scheduledTime,
    isActive,
  });

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
      {/* Timer and Controls */}
      <XStack justifyContent="center" alignItems="center" gap="$3">
        {/* Notes button - only when active */}
        {isActive && (
          <Stack
            width={40}
            height={40}
            backgroundColor="$primaryLight"
            borderRadius="$3"
            justifyContent="center"
            alignItems="center"
            pressStyle={{
              backgroundColor: "$backgroundPress",
            }}
            onPress={handleNotesPress}
          >
            <Ionicons name="document-text-outline" size={20} color="$color" />
          </Stack>
        )}

        {/* Timer */}
        <Text
          fontSize="$9"
          fontWeight="bold"
          color="$color"
          fontFamily="$heading"
          animation="quick"
        >
          {timeString}
        </Text>

        {/* Pause/Play button - only when active */}
        {isActive && (
          <Stack
            width={40}
            height={40}
            backgroundColor="$primaryLight"
            borderRadius="$3"
            justifyContent="center"
            alignItems="center"
            pressStyle={{
              backgroundColor: "$backgroundPress",
            }}
            onPress={togglePause}
          >
            <Ionicons
              name={isPaused ? "play" : "pause"}
              size={20}
              color="$color"
            />
          </Stack>
        )}
      </XStack>

      {/* Workout Info */}
      <YStack gap="$1.5" alignItems="center">
        <Text
          fontSize={isActive ? "$5" : "$6"}
          fontWeight="600"
          color="$color"
          textAlign="center"
          animation="quick"
        >
          {workoutName}
        </Text>

        {/* Description - show when inactive or if no status shown when active */}
        {workoutDescription && (
          <Text
            fontSize="$4"
            color="$textSoft"
            textAlign="center"
            animation="quick"
          >
            {workoutDescription}
          </Text>
        )}

        {/* Status indicators when active */}
        {isActive && (
          <XStack gap="$1.5" alignItems="center">
            {isPaused ? (
              <>
                <Stack
                  width={8}
                  height={8}
                  borderRadius={4}
                  backgroundColor="$yellow8"
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
                />
                <Text fontSize="$3" color="$textSoft">
                  Workout in progress
                </Text>
              </>
            )}
          </XStack>
        )}
      </YStack>
    </YStack>
  );
}
