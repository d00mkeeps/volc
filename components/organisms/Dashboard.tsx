// Dashboard.tsx
import React from "react";
import { Stack, ScrollView } from "tamagui";
import GoalProgressRing from "@/components/molecules/dashboard/GoalProgressRing";
import MuscleGroupSpider from "@/components/molecules/dashboard/MuscleGroupSpider";
import ConsistencyCalendar from "@/components/molecules/dashboard/ConsistencyCalendar";

export default function Dashboard() {
  return (
    <Stack marginBottom="$2" gap="$3">
      {/* Top row - Goal Ring and Spider Chart */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Stack flexDirection="row" gap="$3">
          <GoalProgressRing percentage={22} label="100kg→120kg Bench Press" />
          <MuscleGroupSpider />
        </Stack>
      </ScrollView>

      {/* Bottom row - Consistency Calendar */}
      <ConsistencyCalendar />
    </Stack>
  );
}
