import React from "react";
import { Stack, Text } from "tamagui";
import MuscleGroupStack from "@/components/molecules/dashboard/MuscleGroupSpider";
import ConsistencyCalendar from "@/components/molecules/dashboard/ConsistencyCalendar";
import { useDashboardData } from "@/hooks/useDashboardData";

let count = 0;

export default function Dashboard() {
  console.log(`=== dashboard render count: ${count} ===`);
  count++;

  const { muscleBalance, consistency, isLoading } = useDashboardData();

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

  return (
    <Stack gap="$3">
      {muscleBalance && <MuscleGroupStack data={muscleBalance} />}
      {consistency && (
        <ConsistencyCalendar workoutDays={consistency.workoutDays} />
      )}
    </Stack>
  );
}
