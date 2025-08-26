import React from "react";
import { Stack, Text } from "tamagui";
import MuscleGroupSpider from "@/components/molecules/dashboard/MuscleGroupSpider";
import ConsistencyCalendar from "@/components/molecules/dashboard/ConsistencyCalendar";
import { AllTimeframeData } from "@/types/workout";

interface DashboardProps {
  allData: AllTimeframeData | null;
  isLoading?: boolean;
  error?: string | null;
}

let count = 0;

export default function Dashboard({
  allData,
  isLoading,
  error,
}: DashboardProps) {
  if (isLoading) {
    return (
      <Stack
        backgroundColor="$backgroundSoft"
        borderRadius="$3"
        padding="$5"
        alignItems="center"
        gap="$3"
      >
        <Text color="$textSoft" fontSize="$4">
          Loading dashboard...
        </Text>
      </Stack>
    );
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
        <Text color="$red10" fontSize="$4">
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
        <Text color="$textSoft" fontSize="$4">
          No dashboard data available
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap="$3">
      {/* MuscleGroupSpider handles its own timeframe selection */}
      <MuscleGroupSpider />

      {/* ConsistencyCalendar always shows 2 months data */}
      <ConsistencyCalendar
        workoutDates={allData["2months"].consistency.workoutDates}
      />
    </Stack>
  );
}
