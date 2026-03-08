// /components/molecules/dashboard/Dashboard.tsx

import React from "react";
import { Stack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import MuscleGroupSpider from "@/components/molecules/dashboard/MuscleGroupSpider";
import ConsistencyCalendar from "@/components/molecules/dashboard/ConsistencyCalendar";
import DashboardSkeleton from "@/components/molecules/dashboard/DashboardSkeleton";
import { AllTimeframeData } from "@/types/workout";

interface DashboardProps {
  allData: AllTimeframeData | null;
  isLoading?: boolean;
  error?: string | null;
  onWorkoutDayPress?: (workoutIds: string[]) => void; // ✅ Add callback
}

export default function Dashboard({
  allData,
  isLoading,
  error,
  onWorkoutDayPress, // ✅ Accept callback
}: DashboardProps) {
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error && !allData) {
    return (
      <Stack
        backgroundColor="$backgroundSoft"
        borderRadius="$3"
        padding="$5"
        alignItems="center"
        gap="$3"
      >
        <Text color="$red10" size="medium" textAlign="center">
          Failed to load dashboard: {error}
        </Text>
      </Stack>
    );
  }

  const workouts = allData ? allData["2months"].consistency.workouts : [];

  return (
    <Stack gap="$3">
      <MuscleGroupSpider />
      <ConsistencyCalendar
        workouts={workouts} // ✅ Pass workouts array (empty if no data)
        onDayPress={onWorkoutDayPress} // ✅ Pass callback
      />
    </Stack>
  );
}
