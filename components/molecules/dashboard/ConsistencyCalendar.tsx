import React from "react";
import { ScrollView, Stack, Text, XStack, YStack } from "tamagui";

interface DayData {
  day: number;
  hasWorkout: boolean;
  isToday: boolean;
  dayOfWeek: string;
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
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Mock workout data - realistic pattern
    const defaultWorkoutDays = workoutDays || [1, 3, 5, 8, 10, 12, 14];

    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dayNumber = date.getDate();
      const dayOfWeek = dayNames[date.getDay()];

      days.push({
        day: dayNumber,
        hasWorkout: defaultWorkoutDays.includes(14 - i),
        isToday: i === 0,
        dayOfWeek,
      });
    }

    return days;
  };

  const days = generateDays();
  const workoutCount = days.filter((d) => d.hasWorkout).length;
  const consistencyPercentage = Math.round((workoutCount / 14) * 100);

  const renderDay = (dayData: DayData) => (
    <YStack key={dayData.day} alignItems="center" gap="$1">
      {/* Day of week */}
      <Text
        fontSize="$1"
        color="$colorPress"
        fontWeight="500"
        textAlign="center"
        width={32}
      >
        {dayData.dayOfWeek}
      </Text>

      {/* Day circle */}
      <Stack
        width={32}
        height={32}
        borderRadius="$10"
        backgroundColor={
          dayData.isToday
            ? "$primary"
            : dayData.hasWorkout
            ? "#fef7f6"
            : "$backgroundPress"
        }
        justifyContent="center"
        alignItems="center"
        borderWidth={dayData.isToday ? 2 : dayData.hasWorkout ? 1 : 0}
        borderColor={dayData.isToday ? "$primary" : "#f84f3e"}
      >
        <Text
          fontSize="$2"
          color={
            dayData.isToday
              ? "white"
              : dayData.hasWorkout
              ? "#f84f3e"
              : "$colorPress"
          }
          fontWeight={
            dayData.isToday ? "700" : dayData.hasWorkout ? "600" : "400"
          }
        >
          {dayData.day}
        </Text>
      </Stack>
    </YStack>
  );

  return (
    <Stack
      backgroundColor="$backgroundSoft"
      borderRadius="$3"
      padding="$3"
      gap="$3"
    >
      {/* Header with stats */}
      <XStack justifyContent="space-between" alignItems="center">
        <YStack gap="$0.5">
          <Text fontSize="$4" fontWeight="600" color="$color">
            2-Week Consistency
          </Text>
          <Text fontSize="$2" color="$textSoft">
            {workoutCount} workouts • {consistencyPercentage}% consistent
          </Text>
        </YStack>

        {/* Streak indicator */}
        <Stack
          backgroundColor="#fef7f6"
          paddingHorizontal="$1.5"
          paddingVertical="$1"
          borderRadius="$2"
        >
          <Text fontSize="$2" color="#f84f3e" fontWeight="600">
            🔥 3 day streak
          </Text>
        </Stack>
      </XStack>

      {/* Calendar grid */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <XStack gap="$1.5" paddingHorizontal="$1">
          {days.map(renderDay)}
        </XStack>
      </ScrollView>

      {/* Legend */}
      <XStack justifyContent="center" gap="$5">
        <XStack alignItems="center" gap="$1.5">
          <Stack
            width={12}
            height={12}
            borderRadius="$1"
            backgroundColor="#fef7f6"
            borderWidth={1}
            borderColor="#f84f3e"
          />
          <Text fontSize="$1" color="$textSoft" fontWeight="500">
            Workout
          </Text>
        </XStack>
        <XStack alignItems="center" gap="$1.5">
          <Stack
            width={12}
            height={12}
            borderRadius="$1"
            backgroundColor="$backgroundPress"
          />
          <Text fontSize="$1" color="$textSoft" fontWeight="500">
            Rest
          </Text>
        </XStack>
        <XStack alignItems="center" gap="$1.5">
          <Stack
            width={12}
            height={12}
            borderRadius="$1"
            backgroundColor="#f84f3e"
          />
          <Text fontSize="$1" color="$textSoft" fontWeight="500">
            Today
          </Text>
        </XStack>
      </XStack>
    </Stack>
  );
}
