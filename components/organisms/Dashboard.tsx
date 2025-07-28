// components/organisms/Dashboard.tsx
import React from "react";
import { Stack, ScrollView, Text } from "tamagui";
import GoalProgressRing from "@/components/molecules/dashboard/GoalProgressRing";
import MuscleGroupSpider from "@/components/molecules/dashboard/MuscleGroupSpider";
import ConsistencyCalendar from "@/components/molecules/dashboard/ConsistencyCalendar";
import { useDashboardData } from "@/hooks/useDashboardData";
let count = 0;
export default function Dashboard() {
  console.log(`=== dashboard render count: ${count} ===`);
  count++;
  const { goalProgress, muscleBalance, consistency, isLoading } =
    useDashboardData();

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
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Stack flexDirection="row" gap="$3" paddingHorizontal="$1">
          {goalProgress && <GoalProgressRing {...goalProgress} />}
          {muscleBalance && <MuscleGroupSpider data={muscleBalance} />}
        </Stack>
      </ScrollView>

      {consistency && (
        <ConsistencyCalendar workoutDays={consistency.workoutDays} />
      )}
    </Stack>
  );
}
