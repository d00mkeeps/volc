// components/molecules/WorkoutTrackerHeader.tsx
import React from "react";
import { YStack, XStack, Text, Circle } from "tamagui";
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
      paddingHorizontal="$3"
      paddingVertical="$1.5"
      backgroundColor="$backgroundSoft"
      borderBottomWidth={1}
      borderBottomColor="$borderSoft"
    >
      {/* Timer and Controls Row */}
      <XStack justifyContent="center" alignItems="center" gap="$3">
        {/* Info button - left side */}
        <Circle
          size={28}
          backgroundColor="transparent"
          justifyContent="center"
          alignItems="center"
          pressStyle={
            isActive
              ? {
                  backgroundColor: "$backgroundPress",
                  scale: 0.9,
                }
              : {}
          }
          onPress={isActive ? handleNotesPress : undefined}
          opacity={isActive ? 1 : 0.4}
          animation="quick"
        >
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={isActive ? "$textSoft" : "$textMuted"}
          />
        </Circle>

        {/* Timer - center, smaller */}
        <Text
          fontSize="$7"
          fontWeight="700"
          color="$color"
          fontFamily="$heading"
        >
          {timeString}
        </Text>

        {/* Pause/Play button - right side, orange background when active */}
        <Circle
          size={28}
          backgroundColor={isActive ? "$primary" : "transparent"}
          justifyContent="center"
          alignItems="center"
          pressStyle={
            isActive
              ? {
                  backgroundColor: "$primaryMuted",
                  scale: 0.9,
                }
              : {}
          }
          onPress={isActive ? togglePause : undefined}
          opacity={isActive ? 1 : 0.4}
          animation="quick"
        >
          <Ionicons
            name={isPaused ? "play" : "pause"}
            size={16}
            color={isActive ? "$volcWhite" : "$textMuted"}
          />
        </Circle>
      </XStack>

      {/* Status indicator - smaller and cleaner */}
      <XStack
        justifyContent="center"
        alignItems="center"
        gap="$1.5"
        marginTop="$1"
      >
        <Circle
          size={6}
          backgroundColor={
            !isActive ? "$textMuted" : isPaused ? "$primaryLight" : "$primary"
          }
          animation="quick"
        />
        <Text fontSize="$2" color="$textSoft" fontWeight="500">
          {!isActive
            ? "Workout not started"
            : isPaused
            ? "Workout paused"
            : "Workout in progress"}
        </Text>
      </XStack>
    </YStack>
  );
}
