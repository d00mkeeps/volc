// components/organisms/Dashboard.tsx
import React from "react";
import { Stack, ScrollView, Text } from "tamagui";
import MuscleGroupSpider from "@/components/molecules/dashboard/MuscleGroupSpider";
import ConsistencyCalendar from "@/components/molecules/dashboard/ConsistencyCalendar";
import { useDashboardData } from "@/hooks/useDashboardData";

let count = 0;
export default function Dashboard() {
  console.log(`=== dashboard render count: ${count} ===`);
  count++;
  const { muscleBalance, consistency, isLoading } = useDashboardData(); // Removed goalProgress

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
      {/* Single muscle group chart - now bigger */}
      {muscleBalance && <MuscleGroupSpider data={muscleBalance} />}

      {consistency && (
        <ConsistencyCalendar workoutDays={consistency.workoutDays} />
      )}
    </Stack>
  );
}
