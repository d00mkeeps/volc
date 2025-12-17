import React from "react";
import { YStack, XStack, Circle } from "tamagui";
import Text from "@/components/atoms/core/Text";
import Button from "@/components/atoms/core/Button";
import { AppIcon } from "@/assets/icons/IconMap";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { Alert } from "react-native";

interface WorkoutTrackerHeaderProps {
  workoutName?: string;
  workoutDescription?: string;
  isActive: boolean;
  currentTemplateName?: string;
  onFinishPress?: () => void;
  hasAtLeastOneCompleteSet?: boolean;
}

export default function WorkoutTrackerHeader({
  isActive,
  onFinishPress,
  hasAtLeastOneCompleteSet = false,
}: WorkoutTrackerHeaderProps) {
  const {
    isPaused,
    togglePause,
    updateElapsedTime,
    cancelWorkout,
    getTimeString,
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
      paddingVertical="$2"
      backgroundColor="$backgroundSoft"
      borderBottomWidth={1}
      borderBottomColor="$borderSoft"
    >
      <XStack justifyContent="space-between" alignItems="center">
        {/* Left: Cancel button */}
        <Button
          size="small"
          backgroundColor="transparent"
          borderColor="$red8"
          borderWidth={1}
          color="$red9"
          paddingHorizontal="$3"
          paddingVertical="$1.5"
          pressStyle={{
            backgroundColor: "$red2",
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

        {/* Center: Timer and Pause button */}
        <XStack gap="$3" alignItems="center">
          <Circle
            size={40}
            justifyContent="center"
            alignItems="center"
            pressStyle={
              isActive
                ? {
                    backgroundColor: "$backgroundMuted",
                    scale: 0.9,
                  }
                : {}
            }
            onPress={isActive ? togglePause : undefined}
            opacity={isActive ? 1 : 0.4}
          >
            {isPaused ? (
              <AppIcon name="Play" size={22} color="#f84f3e" />
            ) : (
              <AppIcon name="Pause" size={22} color="#f84f3e" />
            )}
          </Circle>

          <Text
            size="large"
            fontWeight="700"
            color="$color"
            fontFamily="$heading"
          >
            {getTimeString()}
          </Text>
        </XStack>

        {/* Right: Finish button */}
        <Button
          size="small"
          width="30%"
          backgroundColor="$primaryMuted"
          color="$text"
          paddingHorizontal="$3"
          paddingVertical="$1.5"
          pressStyle={{
            backgroundColor: "$primaryPress",
            scale: 0.95,
          }}
          onPress={
            isActive && hasAtLeastOneCompleteSet ? onFinishPress : undefined
          }
          opacity={isActive && hasAtLeastOneCompleteSet ? 1 : 0.4}
          disabled={!isActive || !hasAtLeastOneCompleteSet}
        >
          <Text color="$text" fontWeight="600">
            Finish
          </Text>
        </Button>
      </XStack>
    </YStack>
  );
}
