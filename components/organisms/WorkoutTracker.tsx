import React from "react";
import { Stack, YStack, ScrollView, useWindowDimensions } from "tamagui";
import { BlurView } from "expo-blur";
import WorkoutTrackerHeader from "@/components/molecules/WorkoutTrackerHeader";
import ExerciseTracker from "@/components/molecules/ExerciseTracker";
import { CompleteWorkout } from "@/types/workout";

interface WorkoutTrackerProps {
  workout: CompleteWorkout;
  isActive: boolean;
  countdownTime: string;
}

export default function WorkoutTracker({
  workout,
  isActive,
  countdownTime,
}: WorkoutTrackerProps) {
  const { height: screenHeight } = useWindowDimensions();

  // Calculate positions
  const inactivePosition = screenHeight * 1.035;
  const activePosition = 520; // Your hardcoded value that works well

  return (
    <Stack
      position="absolute"
      bottom={0}
      left={0}
      right={0}
      height={screenHeight + 300}
      animation="medium"
      animateOnly={["transform"]}
      y={isActive ? activePosition : inactivePosition}
    >
      {/* Main content container */}
      <YStack
        flex={1}
        backgroundColor="$backgroundSoft"
        borderTopLeftRadius="$5"
        borderTopRightRadius="$5"
        overflow="scroll"
      >
        {/* Header - Always clear and readable */}
        <WorkoutTrackerHeader
          workoutName={workout.name}
          workoutDescription={workout.description}
          scheduledTime={workout.scheduled_time}
          isActive={isActive}
        />
        <ScrollView
          flex={1}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 100, // Space for floating button
          }}
        >
          {/* Exercise list with blur overlay when inactive */}
          <Stack flex={1} position="relative">
            <YStack gap="$3" padding="$4">
              {workout.workout_exercises
                .sort((a, b) => a.order_index - b.order_index)
                .map((exercise, index) => (
                  <ExerciseTracker
                    key={exercise.id}
                    exercise={exercise}
                    isInitiallyExpanded={index === 0}
                  />
                ))}
            </YStack>

            {/* Blur overlay - only when inactive, only over exercises */}
            {!isActive && (
              <Stack
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                pointerEvents="none" // Allow scroll through blur
              >
                <BlurView intensity={80} tint="dark" style={{ flex: 1 }} />
              </Stack>
            )}
          </Stack>
        </ScrollView>
      </YStack>
    </Stack>
  );
}
