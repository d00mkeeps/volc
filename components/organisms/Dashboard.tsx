import React from "react";
import { Stack, Text } from "tamagui";
import MuscleGroupSpider from "@/components/molecules/dashboard/MuscleGroupSpider";
import ConsistencyCalendar from "@/components/molecules/dashboard/ConsistencyCalendar";

interface MuscleData {
  muscle: string;
  sets: number;
}

interface ConsistencyData {
  workoutDays: number[];
  streak: number;
  totalWorkouts: number;
  score: number;
}

interface TimeframeData {
  muscleBalance: MuscleData[];
  consistency: ConsistencyData;
}

interface AllTimeframeData {
  "1week": TimeframeData;
  "2weeks": TimeframeData;
  "1month": TimeframeData;
  "2months": TimeframeData;
  lastUpdated: string;
}

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
  console.log(`=== dashboard render count: ${count} ===`);
  count++;

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
          Loading your workout insights...
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
      <MuscleGroupSpider allData={allData} />

      {/* ConsistencyCalendar always shows 2 months data */}
      <ConsistencyCalendar
        workoutDays={allData["2months"].consistency.workoutDays}
      />
    </Stack>
  );
}
