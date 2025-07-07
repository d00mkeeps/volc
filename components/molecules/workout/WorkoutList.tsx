import React, { useEffect, useState } from "react";
import { Stack, Text, ScrollView } from "tamagui";
import { useRouter } from "expo-router";
import ContentCard from "@/components/atoms/ContentCard";
import WorkoutDetail from "@/components/organisms/WorkoutDetail";
import { useWorkoutStore } from "@/stores/workout/WorkoutStore";
import { useUserStore } from "@/stores/userProfileStore";

interface WorkoutListProps {
  limit?: number;
}

export default function WorkoutList({ limit = 3 }: WorkoutListProps) {
  const router = useRouter();
  const { workouts, loading, loadWorkouts, deleteWorkout } = useWorkoutStore();
  const { userProfile } = useUserStore();
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (userProfile?.auth_user_uuid) {
      loadWorkouts(userProfile.auth_user_uuid);
    }
  }, [userProfile?.auth_user_uuid, loadWorkouts]);

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

  if (loading && workouts.length === 0) {
    return (
      <Stack flex={1}>
        <Text fontSize="$4" fontWeight="500" color="$text" marginBottom="$2">
          Workouts
        </Text>
        <Text color="$textSoft">Loading workouts...</Text>
      </Stack>
    );
  }

  return (
    <Stack flex={1}>
      <Text fontSize="$4" fontWeight="500" color="$text" marginBottom="$2">
        Recent Workouts
      </Text>
      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
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
      </ScrollView>

      <WorkoutDetail
        workoutId={selectedWorkoutId || ""}
        visible={!!selectedWorkoutId}
        onClose={() => setSelectedWorkoutId(null)}
      />
    </Stack>
  );
}
