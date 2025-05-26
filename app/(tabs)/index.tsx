// app/(tabs)/index.tsx
import React, { useState, useRef } from "react";
import { Stack } from "tamagui";
import Dashboard from "@/components/organisms/Dashboard";
import Header from "@/components/molecules/HomeScreenHeader";
import WorkoutTracker, {
  WorkoutTrackerRef,
} from "@/components/organisms/WorkoutTracker";
import FloatingActionButton from "@/components/atoms/buttons/FloatingActionButton";
import { useWorkoutTimer } from "@/hooks/core/useWorkoutTimer";
import { mockWorkout } from "@/mockdata";
import { useUserSession } from "@/hooks/useUserSession";

export default function HomeScreen() {
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const workoutTrackerRef = useRef<WorkoutTrackerRef>(null);

  const {
    isActive,
    timeString,
    isPaused,
    startWorkout,
    finishWorkout,
    togglePause,
  } = useUserSession();

  const handleToggleWorkout = async () => {
    if (isActive) {
      try {
        await finishWorkout();
        workoutTrackerRef.current?.finishWorkout();
      } catch (error) {
        console.error("Failed to finish workout:", error);
      }
    } else {
      startWorkout(mockWorkout);
      workoutTrackerRef.current?.startWorkout();
    }
  };

  const handleActiveChange = (active: boolean) => {
    setIsWorkoutActive(active);
  };

  return (
    <Stack flex={1} backgroundColor="$background">
      <Stack flex={1} padding="$4">
        <Header
          greeting="Welcome to Volc!"
          onSettingsPress={() => console.log("Settings pressed")}
        />
        <Stack marginBottom="$5">
          <Dashboard />
        </Stack>
      </Stack>

      <WorkoutTracker
        ref={workoutTrackerRef}
        workout={mockWorkout}
        isActive={isWorkoutActive}
        timeString={timeString}
        isPaused={isPaused}
        togglePause={togglePause}
        onActiveChange={handleActiveChange}
      />

      <FloatingActionButton
        label={isWorkoutActive ? "FINISH" : "START"}
        onPress={handleToggleWorkout}
      />
    </Stack>
  );
}
