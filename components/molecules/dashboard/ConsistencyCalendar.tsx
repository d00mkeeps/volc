// /components/molecules/dashboard/ConsistencyCalendar.tsx

import React, { useState, useRef, useEffect } from "react";
import { ScrollView, Stack, XStack, YStack } from "tamagui";
import Text from "@/components/atoms/core/Text";

interface DayData {
  day: number;
  hasWorkout: boolean;
  isToday: boolean;
  dayOfWeek: string;
  workoutIds: string[]; // ✅ Add workout IDs
}

interface ConsistencyCalendarProps {
  workouts?: Array<{ id: string; date: string }>;
  onDayPress?: (workoutIds: string[]) => void; // ✅ Add callback
}

export default function ConsistencyCalendar({
  workouts = [],
  onDayPress, // ✅ Accept callback
}: ConsistencyCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // ✅ Parse workouts to get dates and map them to IDs
  const workoutDateMap = new Map<string, string[]>();
  workouts.forEach(({ id, date }) => {
    const dateObj = new Date(date);
    const dateKey = `${dateObj.getFullYear()}-${dateObj.getMonth()}-${dateObj.getDate()}`;

    if (!workoutDateMap.has(dateKey)) {
      workoutDateMap.set(dateKey, []);
    }
    workoutDateMap.get(dateKey)!.push(id);
  });

  const workoutDateObjects = workouts.map(({ date }) => new Date(date));

  // Calculate the number of weeks to show based on oldest workout
  // /components/molecules/dashboard/ConsistencyCalendar.calculateWeeksToShow
  const calculateWeeksToShow = () => {
    if (workoutDateObjects.length === 0) {
      return 1;
    }

    const today = new Date();
    const oldestWorkout = new Date(
      Math.min(...workoutDateObjects.map((d) => d.getTime())),
    );

    const diffInMs = today.getTime() - oldestWorkout.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const weeksNeeded = Math.ceil(diffInDays / 7);

    return Math.max(1, weeksNeeded) + 1;
  };

  const totalWeeks = calculateWeeksToShow();
  const hasWorkouts = workoutDateObjects.length > 0;

  // Generate weeks of data (oldest to newest)
  // /components/molecules/dashboard/ConsistencyCalendar.generateWeeks
  const generateWeeks = () => {
    const weeks = [];
    const today = new Date();
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let weekOffset = totalWeeks - 1; weekOffset >= 0; weekOffset--) {
      if (weekOffset === totalWeeks - 1 && hasWorkouts) {
        weeks.push({ weekOffset, days: [], isPlaceholder: true });
        continue;
      }

      const days: DayData[] = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - (weekOffset * 7 + i));
        const dayNumber = date.getDate();
        const dayOfWeek = dayNames[date.getDay()];

        // ✅ Get workout IDs for this date
        const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        const workoutIds = workoutDateMap.get(dateKey) || [];
        const hasWorkout = workoutIds.length > 0;

        const isToday = weekOffset === 0 && i === 0;

        days.push({
          day: dayNumber,
          hasWorkout,
          isToday,
          dayOfWeek,
          workoutIds, // ✅ Include workout IDs
        });
      }

      weeks.push({ weekOffset, days, isPlaceholder: false });
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
  }, [containerWidth, totalWeeks]);

  // ✅ Handle day press - call callback with workout IDs
  // /components/molecules/dashboard/ConsistencyCalendar.handleDayPress
  const handleDayPress = (dayData: DayData) => {
    console.log("👆 [ConsistencyCalendar] Day pressed:", {
      day: dayData.day,
      dayOfWeek: dayData.dayOfWeek,
      hasWorkout: dayData.hasWorkout,
      workoutIdsCount: dayData.workoutIds.length,
      workoutIds: dayData.workoutIds,
    });

    if (dayData.workoutIds.length > 0) {
      console.log(
        `🗓️ [ConsistencyCalendar] Pressed day ${dayData.day} (${dayData.dayOfWeek})`,
        `- Workout IDs: [${dayData.workoutIds.join(", ")}]`,
      );
      // ✅ Call the callback instead of managing state
      if (onDayPress) {
        console.log(
          "📞 [ConsistencyCalendar] Calling onDayPress callback with:",
          dayData.workoutIds,
        );
        onDayPress(dayData.workoutIds);
      } else {
        console.warn(
          "⚠️ [ConsistencyCalendar] No onDayPress callback provided!",
        );
      }
    } else {
      console.log("⚠️ [ConsistencyCalendar] Day has no workout IDs");
    }
  };

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
              ? "white"
              : "$backgroundPress"
        }
        justifyContent="center"
        alignItems="center"
        borderWidth={dayData.isToday ? 2 : dayData.hasWorkout ? 1 : 0}
        borderColor={dayData.isToday ? "$primary" : "#f84f3e"}
        // ✅ Make pressable with visual feedback
        {...(dayData.hasWorkout && {
          pressStyle: {
            opacity: 0.7,
            scale: 0.95,
          },
          onPress: () => handleDayPress(dayData),
          cursor: "pointer",
        })}
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
      paddingHorizontal="$3"
      paddingVertical="$2"
      gap="$3"
    >
      {/* Header with Indicators */}
      <Stack
        height={24}
        justifyContent="center"
        onLayout={(e) => {
          const { width } = e.nativeEvent.layout;
          console.log(`[CalendarHeader] Total Width: ${width}`);
        }}
      >
        {/* Labels Layer */}
        <XStack justifyContent="space-between" alignItems="center">
          <Text size="medium" fontWeight="600" color="$color">
            Recent Workouts
          </Text>

          {currentWeek > 0 && (
            <Text size="medium" color="$textSoft" textAlign="right">
              {currentWeek === 1 ? "Previous week" : `${currentWeek} weeks ago`}
            </Text>
          )}
        </XStack>

        {/* Indicators Layer - Absolute Centered */}
        <XStack
          position="absolute"
          left={0}
          right={0}
          top={0}
          bottom={0}
          justifyContent="center"
          alignItems="center"
          pointerEvents="none"
          onLayout={(e) => {
            const { x, width } = e.nativeEvent.layout;
            console.log(
              `[CalendarDots] X: ${x}, Width: ${width}, CenterX: ${x + width / 2}`,
            );
          }}
        >
          <XStack gap="$1">
            {weeks.map((_, index) => {
              const weekOffset = weeks[index].weekOffset;
              const isActive = currentWeek === weekOffset;
              return (
                <Stack
                  key={index}
                  width={6}
                  height={6}
                  borderRadius={3}
                  backgroundColor={isActive ? "white" : "#999"}
                  opacity={isActive ? 1 : 0.4}
                />
              );
            })}
          </XStack>
        </XStack>
      </Stack>

      {/* Scrollable weeks */}
      <Stack
        onLayout={(event) => {
          const { width } = event.nativeEvent.layout;
          console.log(`[CalendarContainer] Width: ${width}`);
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
            <Stack
              key={index}
              width={containerWidth}
              justifyContent="center"
              alignItems="center"
            >
              {week.isPlaceholder ? (
                <Stack justifyContent="center" alignItems="center" height={40}>
                  <Text
                    size="medium"
                    color="$textSoft"
                    fontWeight="500"
                    opacity={0.7}
                  >
                    nothing to see here!
                  </Text>
                </Stack>
              ) : (
                <XStack
                  gap="$1"
                  justifyContent="space-evenly"
                  alignItems="center"
                  width="100%"
                >
                  {week.days.map(renderDay)}
                </XStack>
              )}
            </Stack>
          ))}
        </ScrollView>
      </Stack>
    </Stack>
  );
}
