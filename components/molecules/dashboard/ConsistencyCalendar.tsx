import React, { useState, useRef, useEffect } from "react";
import { ScrollView, Stack, XStack, YStack } from "tamagui";
import Text from "@/components/atoms/core/Text";

interface DayData {
  day: number;
  hasWorkout: boolean;
  isToday: boolean;
  dayOfWeek: string;
}

interface ConsistencyCalendarProps {
  workoutDates?: string[]; // Changed from workoutDays to workoutDates (ISO date strings)
}

export default function ConsistencyCalendar({
  workoutDates = [],
}: ConsistencyCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const totalWeeks = 9;

  // Convert workout date strings to Date objects for easy comparison
  const workoutDateObjects = workoutDates.map((dateStr) => new Date(dateStr));

  // Generate weeks of data (oldest to newest)
  const generateWeeks = () => {
    const weeks = [];
    const today = new Date();
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let weekOffset = 8; weekOffset >= 0; weekOffset--) {
      const days: DayData[] = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - (weekOffset * 7 + i));
        const dayNumber = date.getDate();
        const dayOfWeek = dayNames[date.getDay()];

        // Fix: Compare actual dates, not just day numbers
        const hasWorkout = workoutDateObjects.some(
          (workoutDate) =>
            workoutDate.getFullYear() === date.getFullYear() &&
            workoutDate.getMonth() === date.getMonth() &&
            workoutDate.getDate() === date.getDate()
        );

        // Check if this date is actually today
        const isToday = weekOffset === 0 && i === 0;

        days.push({
          day: dayNumber,
          hasWorkout,
          isToday,
          dayOfWeek,
        });
      }

      weeks.push({ weekOffset, days });
    }

    return weeks;
  };

  const weeks = generateWeeks();

  // Scroll to current week once we have the container width
  useEffect(() => {
    if (containerWidth > 0) {
      const currentWeekIndex = totalWeeks - 1;
      const targetOffset = currentWeekIndex * containerWidth;

      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: targetOffset,
          animated: false,
        });
      }, 50);
    }
  }, [containerWidth]);

  const renderDay = (dayData: DayData) => (
    <YStack
      key={`${dayData.day}-${dayData.dayOfWeek}`}
      alignItems="center"
      flex={1}
    >
      <Stack
        width={40}
        height={40}
        borderRadius="$3"
        backgroundColor={
          dayData.isToday
            ? "$primary" // Red for today
            : dayData.hasWorkout
            ? "white" // White for workout days
            : "$backgroundPress" // Default for no workout
        }
        justifyContent="center"
        alignItems="center"
        borderWidth={dayData.isToday ? 2 : dayData.hasWorkout ? 1 : 0}
        borderColor={dayData.isToday ? "$primary" : "#f84f3e"}
      >
        <YStack alignItems="center" gap="$0.5">
          <Text
            size="medium"
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
          <Text
            size="medium"
            color={
              dayData.isToday
                ? "white"
                : dayData.hasWorkout
                ? "#f84f3e"
                : "$colorPress"
            }
            fontWeight="500"
            opacity={0.8}
          >
            {dayData.dayOfWeek}
          </Text>
        </YStack>
      </Stack>
    </YStack>
  );

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const weekIndex = Math.round(offsetX / containerWidth);
    const week = weeks[weekIndex];
    setCurrentWeek(week?.weekOffset || 0);
  };

  return (
    <Stack
      backgroundColor="$backgroundSoft"
      borderRadius="$3"
      padding="$3"
      gap="$3"
    >
      {/* Header */}
      <XStack justifyContent="space-between" alignItems="center">
        <Text size="medium" fontWeight="600" color="$color">
          Recent Workouts
        </Text>

        {currentWeek > 0 && (
          <Text size="medium" color="$textSoft">
            {currentWeek === 1 ? "Previous week" : `${currentWeek} weeks ago`}
          </Text>
        )}
      </XStack>

      {/* Scrollable weeks */}
      <Stack
        onLayout={(event) => {
          const { width } = event.nativeEvent.layout;
          setContainerWidth(width);
        }}
      >
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          snapToInterval={containerWidth}
          decelerationRate="fast"
        >
          {weeks.map((week, index) => (
            <XStack
              key={index}
              gap="$1"
              width={containerWidth}
              justifyContent="space-evenly"
              alignItems="center"
            >
              {week.days.map(renderDay)}
            </XStack>
          ))}
        </ScrollView>
      </Stack>
    </Stack>
  );
}
