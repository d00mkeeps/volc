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

  if (error) {
    return (
      <Stack
        backgroundColor="$backgroundSoft"
        borderRadius="$3"
        padding="$5"
        alignItems="center"
        gap="$3"
      >
        <Text color="$red10" size="medium">
          Failed to load dashboard: {error}
        </Text>
      </Stack>
    );
  }

  if (!allData) {
    return (
      <Stack
        backgroundColor="$backgroundSoft"
        borderRadius="$3"
        padding="$5"
        alignItems="center"
        gap="$3"
      >
        <Text color="$textSoft" size="medium">
          No dashboard data available
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap="$3">
      <MuscleGroupSpider />
      <ConsistencyCalendar
        workouts={allData["2months"].consistency.workouts} // ✅ Pass workouts array
        onDayPress={onWorkoutDayPress} // ✅ Pass callback
      />
    </Stack>
  );
}
