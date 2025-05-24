import React, { useState } from "react";
import { Stack } from "tamagui";
import Dashboard from "@/components/organisms/Dashboard";
import Header from "@/components/molecules/HomeScreenHeader";
import WorkoutTracker from "@/components/organisms/WorkoutTracker";
import FloatingActionButton from "@/components/atoms/buttons/FloatingActionButton";
import { mockWorkout } from "@/mockdata";

export default function HomeScreen() {
  const [countdownTime, setCountdownTime] = useState("00:05:00");
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);

  const handleToggleWorkout = () => {
    setIsWorkoutActive(!isWorkoutActive);
  };

  return (
    <Stack flex={1} backgroundColor="$background">
      {/* Main content - Dashboard and Header */}
      <Stack flex={1} padding="$4">
        <Header
          greeting="Welcome to Volc!"
          onSettingsPress={() => console.log("Settings pressed")}
        />

        <Stack marginBottom="$5">
          <Dashboard />
        </Stack>
      </Stack>

      {/* WorkoutTracker - no button logic needed */}
      <WorkoutTracker
        workout={mockWorkout}
        isActive={isWorkoutActive}
        countdownTime={countdownTime}
      />

      {/* Floating button - START or FINISH based on state */}
      <FloatingActionButton
        icon={isWorkoutActive ? "checkmark-circle" : "play"}
        label={isWorkoutActive ? "FINISH" : "START"}
        onPress={handleToggleWorkout}
      />
    </Stack>
  );
}
