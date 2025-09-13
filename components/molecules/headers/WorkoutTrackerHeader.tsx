// components/molecules/WorkoutTrackerHeader.tsx
import React from "react";
import { YStack, XStack, Circle, Stack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import Button from "@/components/atoms/core/Button";
import { Play, Pause, ChevronDown } from "@/assets/icons/IconMap";
import { useUserSessionStore } from "@/stores/userSessionStore";

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
  } = useUserSessionStore();

  const handleTemplatePress = () => {
    openTemplateSelector();
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
      <XStack justifyContent="center" alignItems="center" gap="$3">
        {/* Timer - from store */}
        <Text
          size="medium"
          fontWeight="700"
          color="$color"
          fontFamily="$heading"
        >
          {getTimeString()}
        </Text>

        {/* Pause/Play button - using store methods */}
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
        >
          {isPaused ? (
            <Play size={16} color={isActive ? "white" : "$textMuted"} />
          ) : (
            <Pause size={16} color={isActive ? "white" : "$textMuted"} />
          )}
        </Circle>
      </XStack>

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
        />
        <Text size="medium" color="$textSoft" fontWeight="500">
          {!isActive
            ? "Workout not started"
            : isPaused
            ? "Workout paused"
            : "Workout in progress"}
        </Text>
      </XStack>

      <XStack
        justifyContent="space-between"
        alignItems="center"
        marginTop="$3"
        paddingTop="$2"
        borderTopWidth={1}
        borderTopColor="$borderSoft"
      >
        <YStack flex={1} marginRight="$3">
          <Text size="medium" color="$textMuted" fontWeight="500">
            Template
          </Text>
          <Text
            size="medium"
            color="$textSoft"
            numberOfLines={1}
            marginTop="$0.5"
          >
            {currentTemplateName || "No template selected"}
          </Text>
        </YStack>

        <Button
          size="medium"
          backgroundColor="transparent"
          borderColor="$borderSoft"
          borderWidth={1}
          paddingHorizontal="$2"
          pressStyle={{
            backgroundColor: "$backgroundPress",
            borderColor: "$primary",
          }}
          onPress={handleTemplatePress}
        >
          <XStack alignItems="center" gap="$1.5">
            <Text size="medium" color="$textSoft">
              Change
            </Text>
            <ChevronDown size={14} color="$textSoft" />
          </XStack>
        </Button>
      </XStack>
    </YStack>
  );
}
