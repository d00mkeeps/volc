import React from "react";
import { Stack, YStack, XStack, Text, Button } from "tamagui";
import { LinearGradient } from "expo-linear-gradient";
import { CompleteWorkout } from "@/types/workout";

interface WorkoutTrackingModalProps {
  workout: CompleteWorkout;
  isPassive: boolean;
  countdownTime?: string;
  elapsedTime?: string;
  onStartWorkout: () => void;
  onClose: () => void;
}

export default function WorkoutTrackingModal({
  workout,
  isPassive,
  countdownTime = "00:00:00",
  elapsedTime = "00:00:00",
  onStartWorkout,
  onClose,
}: WorkoutTrackingModalProps) {
  const exercises = workout.workout_exercises.sort(
    (a, b) => a.order_index - b.order_index
  );

  const formatSetInfo = (sets: any[]) => {
    if (!sets || sets.length === 0) return "No sets";

    const firstSet = sets[0];
    const allSimilar = sets.every(
      (set) => set.weight === firstSet.weight && set.reps === firstSet.reps
    );

    if (allSimilar && firstSet.weight && firstSet.reps) {
      return `${sets.length} x ${firstSet.reps} @ ${firstSet.weight}kg`;
    } else if (allSimilar && firstSet.reps) {
      return `${sets.length} x ${firstSet.reps}`;
    } else {
      return `${sets.length} sets`;
    }
  };

  return (
    <Stack
      position="absolute"
      bottom={0}
      left="$4"
      right="$4"
      height={isPassive ? "30%" : "100%"}
      backgroundColor="$backgroundSoft"
      borderRadius={isPassive ? "$5" : 0}
      overflow="hidden"
      animation="quick"
      marginBottom="$4"
    >
      <YStack flex={1} position="relative">
        {/* Header */}
        <YStack gap="$3" paddingVertical="$5" paddingHorizontal="$4">
          {/* Timer - Countdown in passive, elapsed in active */}
          <Stack alignItems="center">
            <Text
              fontSize={isPassive ? "$10" : "$8"}
              fontWeight="bold"
              color="$color"
              fontFamily="$heading"
            >
              {isPassive ? countdownTime : elapsedTime}
            </Text>
          </Stack>

          {/* Workout Info */}
          <YStack gap="$1.5" alignItems="center">
            <Text
              fontSize="$6"
              fontWeight="600"
              color="$color"
              textAlign="center"
            >
              {workout.name}
            </Text>
            {isPassive && (
              <Text
                fontSize="$4"
                color="$textSoft"
                textAlign="center"
                paddingHorizontal="$4"
              >
                Ready to crush this workout? Let's go!
              </Text>
            )}
          </YStack>

          {/* START Button - only in passive state */}
          {isPassive && (
            <Stack alignItems="center" marginTop="$3">
              <Button
                size="$5"
                backgroundColor="$primary"
                color="white"
                fontWeight="bold"
                paddingHorizontal="$8"
                onPress={onStartWorkout}
                pressStyle={{
                  backgroundColor: "$primaryLight",
                }}
              >
                START
              </Button>
            </Stack>
          )}
        </YStack>

        {/* Exercise List */}
        <YStack flex={1} paddingHorizontal="$4">
          {/* Table Header */}
          <XStack
            backgroundColor="$background"
            paddingVertical="$3"
            paddingHorizontal="$4"
            borderTopLeftRadius="$3"
            borderTopRightRadius="$3"
          >
            <Text flex={2} fontSize="$3" fontWeight="600" color="$textSoft">
              Exercise
            </Text>
            <Text
              flex={1}
              fontSize="$3"
              fontWeight="600"
              color="$textSoft"
              textAlign="center"
            >
              Sets
            </Text>
          </XStack>

          {/* Exercise Rows Container */}
          <Stack
            flex={1}
            backgroundColor="$background"
            borderBottomLeftRadius="$3"
            borderBottomRightRadius="$3"
            overflow="hidden"
            position="relative"
          >
            <YStack>
              {exercises.map((exercise, index) => (
                <XStack
                  key={exercise.id}
                  paddingVertical="$3"
                  paddingHorizontal="$4"
                  borderBottomWidth={index < exercises.length - 1 ? 1 : 0}
                  borderBottomColor="$borderSoft"
                >
                  <Text flex={2} fontSize="$4" color="$color" numberOfLines={1}>
                    {exercise.name || "Unnamed Exercise"}
                  </Text>
                  <Text
                    flex={1}
                    fontSize="$3"
                    color="$textSoft"
                    textAlign="center"
                  >
                    {formatSetInfo(exercise.workout_exercise_sets)}
                  </Text>
                </XStack>
              ))}
            </YStack>

            {/* LinearGradient Overlay - only in passive state */}
            {isPassive && (
              <Stack
                position="absolute"
                bottom={0}
                left={0}
                right={0}
                height={40}
                backgroundColor="$backgroundSoft"
                opacity={0.8}
              />
            )}
          </Stack>
        </YStack>
      </YStack>
    </Stack>
  );
}
