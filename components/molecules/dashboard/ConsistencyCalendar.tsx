// /components/molecules/dashboard/ConsistencyCalendar.tsx
import React, { useState, useRef, useEffect } from "react";
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
  const [currentWeek, setCurrentWeek] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const totalWeeks = 9;

  // Generate weeks of data (oldest to newest)
  const generateWeeks = () => {
    const weeks = [];
    const today = new Date();
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const defaultWorkoutDays = workoutDays || [
      1, 3, 5, 8, 10, 12, 15, 17, 19, 22, 24, 26,
    ];

    for (let weekOffset = 8; weekOffset >= 0; weekOffset--) {
      const days: DayData[] = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - (weekOffset * 7 + i));
        const dayNumber = date.getDate();
        const dayOfWeek = dayNames[date.getDay()];

        days.push({
          day: dayNumber,
          hasWorkout: defaultWorkoutDays.includes(weekOffset * 7 + (7 - i)),
          isToday: weekOffset === 0 && i === 0,
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
        <YStack alignItems="center" gap="$0.5">
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
          <Text
            fontSize="$1"
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
        <Text fontSize="$4" fontWeight="600" color="$color">
          7-Day Consistency
        </Text>

        {currentWeek > 0 && (
          <Text fontSize="$2" color="$textSoft">
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
