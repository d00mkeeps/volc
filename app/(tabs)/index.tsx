import React, { useState } from "react";
import { Stack } from "tamagui";
import Dashboard from "@/components/organisms/Dashboard";
import Header from "@/components/molecules/HomeScreenHeader";
import WorkoutPreview from "@/components/molecules/WorkoutPreview";
import { CompleteWorkout } from "@/types/workout";

export default function HomeScreen() {
  const [countdownTime, setCountdownTime] = useState("00:05:00");

  // Mock workout data
  const mockWorkout: CompleteWorkout = {
    id: "test-workout-1",
    user_id: "test-user",
    name: "Upper Body Power",
    notes: JSON.stringify([""]),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_template: true,
    workout_exercises: [
      {
        id: "ex-1",
        workout_id: "test-workout-1",
        name: "Bench Press",
        order_index: 0,
        weight_unit: "kg",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        workout_exercise_sets: [
          {
            id: "set-1",
            exercise_id: "ex-1",
            set_number: 1,
            weight: 80,
            reps: 8,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "set-2",
            exercise_id: "ex-1",
            set_number: 2,
            weight: 80,
            reps: 8,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "set-3",
            exercise_id: "ex-1",
            set_number: 3,
            weight: 80,
            reps: 8,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      },
      {
        id: "ex-2",
        workout_id: "test-workout-1",
        name: "Overhead Press",
        order_index: 1,
        weight_unit: "kg",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        workout_exercise_sets: [
          {
            id: "set-4",
            exercise_id: "ex-2",
            set_number: 1,
            weight: 50,
            reps: 10,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      },
      {
        id: "ex-3",
        workout_id: "test-workout-1",
        name: "Incline Dumbbell Press",
        order_index: 2,
        weight_unit: "kg",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        workout_exercise_sets: [
          {
            id: "set-7",
            exercise_id: "ex-3",
            set_number: 1,
            weight: 30,
            reps: 12,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      },
      {
        id: "ex-4",
        workout_id: "test-workout-1",
        name: "Tricep Dips",
        order_index: 3,
        weight_unit: "kg",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        workout_exercise_sets: [
          {
            id: "set-9",
            exercise_id: "ex-4",
            set_number: 1,
            reps: 15,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      },
    ],
  };

  const handleStartWorkout = () => {
    console.log("Starting workout!");
    // Later this will open the full tracking modal
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
      <Stack flex={1} marginTop="$4">
        <WorkoutPreview
          workout={mockWorkout}
          countdownTime={countdownTime}
          onStartWorkout={handleStartWorkout}
        />
      </Stack>
    </Stack>
  );
}
