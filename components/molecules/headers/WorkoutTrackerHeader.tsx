import React from "react";
import { YStack, XStack, Circle } from "tamagui";
import Text from "@/components/atoms/core/Text";
import Button from "@/components/atoms/core/Button";
import { Play, Pause } from "@/assets/icons/IconMap";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { Alert } from "react-native";

interface WorkoutTrackerHeaderProps {
  workoutName?: string;
  workoutDescription?: string;
  isActive: boolean;
  currentTemplateName?: string;
}

export default function WorkoutTrackerHeader({
  isActive,
  currentTemplateName,
}: WorkoutTrackerHeaderProps) {
  const {
    openTemplateSelector,
    getTimeString,
    isPaused,
    togglePause,
    updateElapsedTime,
    cancelWorkout,
  } = useUserSessionStore();

  const handleCancelWorkout = () => {
    Alert.alert(
      "Cancel Workout",
      "Are you sure you want to cancel this workout? All progress will be lost.",
      [
        { text: "Keep Going", style: "cancel" },
        {
          text: "Cancel Workout",
          style: "destructive",
          onPress: () => cancelWorkout(),
        },
      ]
    );
  };

  React.useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      updateElapsedTime();
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, updateElapsedTime]);

  return (
    <YStack
      paddingHorizontal="$3"
      paddingVertical="$1.5"
      backgroundColor="$backgroundSoft"
      borderBottomWidth={1}
      borderBottomColor="$borderSoft"
    >
      {/* Timer and Controls Row */}
      <XStack
        justifyContent="center"
        alignItems="center"
        gap="$4"
        paddingTop="$2"
      >
        {/* Pause/Play button - moved to left */}
        <Circle
          size={40}
          justifyContent="center"
          alignItems="center"
          pressStyle={
            isActive
              ? {
                  backgroundColor: "$text",
                  scale: 0.9,
                }
              : {}
          }
          onPress={isActive ? togglePause : undefined}
          opacity={isActive ? 1 : 0.4}
        >
          {isPaused ? (
            <Play size={22} color="#f84f3e" />
          ) : (
            <Pause size={22} color="#f84f3e" />
          )}
        </Circle>

        {/* Timer - made bigger */}
        <Text
          size="large"
          fontWeight="700"
          color="$color"
          fontFamily="$heading"
        >
          {getTimeString()}
        </Text>

        {/* Cancel button - red outline */}
        <Button
          size="small"
          backgroundColor="transparent"
          borderColor="$red8"
          borderWidth={1}
          color="$red9"
          paddingHorizontal="$3"
          paddingVertical="$1.5"
          pressStyle={{
            backgroundColor: "",
            borderColor: "$red9",
            scale: 0.95,
          }}
          onPress={isActive ? handleCancelWorkout : undefined}
          opacity={isActive ? 1 : 0.4}
        >
          <Text size="small" color="$red9" fontWeight="600">
            Cancel
          </Text>
        </Button>
      </XStack>

      <XStack
        justifyContent="center"
        alignItems="center"
        gap="$1.5"
        marginTop="$1"
        paddingVertical="$3"
      >
        <Circle
          size={6}
          backgroundColor={
            !isActive ? "$textMuted" : isPaused ? "$primaryLight" : "$primary"
          }
        />
        <Text size="medium" color="$textSoft" fontWeight="500">
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
