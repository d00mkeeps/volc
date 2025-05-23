// components/molecules/ConsistencyCalendar.tsx
import React from "react";
import { ScrollView, Stack, Text } from "tamagui";

interface DayData {
  day: number;
  hasWorkout: boolean;
  isToday: boolean;
}

interface ConsistencyCalendarProps {
  workoutDays?: number[];
}

export default function ConsistencyCalendar({
  workoutDays,
}: ConsistencyCalendarProps) {
  // Generate last 14 days
  const generateDays = (): DayData[] => {
    const days: DayData[] = [];
    const today = new Date();

    // Mock workout data - realistic pattern
    const defaultWorkoutDays = workoutDays || [1, 3, 5, 8, 10, 12, 14];

    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dayNumber = date.getDate();

      days.push({
        day: dayNumber,
        hasWorkout: defaultWorkoutDays.includes(14 - i),
        isToday: i === 0,
      });
    }

    return days;
  };

  const days = generateDays();

  const renderDay = (dayData: DayData) => (
    <Stack
      key={dayData.day}
      width={32}
      height={32}
      borderRadius="$4"
      backgroundColor={
        dayData.isToday
          ? "$primary"
          : dayData.hasWorkout
          ? "$primaryLight"
          : "$backgroundPress"
      }
      justifyContent="center"
      alignItems="center"
      borderWidth={dayData.isToday ? 2 : 0}
      borderColor="$primary"
    >
      <Text
        fontSize="$2"
        color={dayData.isToday || dayData.hasWorkout ? "white" : "$colorPress"}
        fontWeight={dayData.isToday ? "800" : "400"}
      >
        {dayData.day}
      </Text>
    </Stack>
  );

  return (
    <Stack
      backgroundColor="$backgroundSoft"
      borderRadius="$4"
      padding="$3"
      gap="$3"
    >
      <Text fontSize="$3" fontWeight="500" color="$color" textAlign="center">
        2-Week Consistency
      </Text>

      {/* Single row of 14 days */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Stack flexDirection="row" gap="$1.5" paddingHorizontal="$1">
          {days.map(renderDay)}
        </Stack>
      </ScrollView>

      <Stack flexDirection="row" justifyContent="center" gap="$3">
        <Stack flexDirection="row" alignItems="center" gap="$1">
          <Stack
            width={8}
            height={8}
            borderRadius="$1"
            backgroundColor="$primaryLight"
          />
          <Text fontSize="$1" color="$colorPress">
            Workout
          </Text>
        </Stack>
        <Stack flexDirection="row" alignItems="center" gap="$1">
          <Stack
            width={8}
            height={8}
            borderRadius="$1"
            backgroundColor="$backgroundPress"
          />
          <Text fontSize="$1" color="$colorPress">
            Rest
          </Text>
        </Stack>
      </Stack>
    </Stack>
  );
}
