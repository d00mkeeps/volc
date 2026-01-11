// /components/molecules/workout/WorkoutList.tsx

import React, { useState } from "react";
import { Stack, ScrollView } from "tamagui";
import Text from "@/components/atoms/core/Text";
import ContentCard from "@/components/atoms/core/ContentCard";
import WorkoutViewModal from "@/components/organisms/workout/WorkoutViewModal";
import { useWorkoutStore } from "@/stores/workout/WorkoutStore";

interface WorkoutListProps {
  limit?: number;
}

export default function WorkoutList({ limit = 3 }: WorkoutListProps) {
  const { workouts, loading, deleteWorkout } = useWorkoutStore();
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(
    null
  );

  const displayedWorkouts = workouts.slice(0, limit);

  const handleWorkoutPress = (workoutId: string) => {
    setSelectedWorkoutId(workoutId);
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    try {
      await deleteWorkout(workoutId);
    } catch (error) {
      console.error("Failed to delete workout:", error);
    }
  };

  const formatWorkoutSubtitle = (workout: any) => {
    const exerciseCount = workout.workout_exercises?.length || 0;
    const exerciseText = `${exerciseCount} exercise${
      exerciseCount !== 1 ? "s" : ""
    }`;
    return workout.description
      ? `${exerciseText} • ${workout.description}`
      : exerciseText;
  };

  // Render content based on state
  let content;

  if (loading && workouts.length === 0) {
    content = (
      <Stack padding="$4">
        <Text size="medium" fontWeight="500" color="$text" marginBottom="$2">
          Workouts
        </Text>
        <Text color="$textSoft">Loading workouts...</Text>
      </Stack>
    );
  } else if (workouts.length === 0) {
    content = (
      <Stack padding="$4" alignItems="center">
        <Text size="medium" color="$textSoft" textAlign="center">
          No workouts yet. Create your first workout to get started!
        </Text>
      </Stack>
    );
  } else {
    content = (
      <Stack gap="$2">
        {displayedWorkouts.map((workout) => (
          <ContentCard
            key={workout.id}
            title={workout.name}
            subtitle={formatWorkoutSubtitle(workout)}
            date={new Date(workout.created_at)}
            onPress={() => handleWorkoutPress(workout.id)}
            showDelete={true}
            onDelete={() => handleDeleteWorkout(workout.id)}
          />
        ))}
      </Stack>
    );
  }

  return (
    <Stack flex={1}>
      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        {content}
      </ScrollView>

      {/* Always render the modal - it controls its own visibility */}
      <WorkoutViewModal
        isVisible={selectedWorkoutId !== null}
        onClose={() => setSelectedWorkoutId(null)}
        workoutId={selectedWorkoutId || ""}
      />
    </Stack>
  );
}
