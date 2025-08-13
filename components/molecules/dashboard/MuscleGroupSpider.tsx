// /components/molecules/dashboard/MuscleGroupSpider.tsx
import React, { useState } from "react";
import { Stack, Text, YStack, XStack, Select } from "tamagui";
import Svg, { Polygon, Circle, Line } from "react-native-svg";
import { ChevronDown } from "@tamagui/lucide-icons";

interface MuscleData {
  muscle: string;
  sets: number;
}

interface MuscleGroupSpiderProps {
  data?: MuscleData[];
}

export default function MuscleGroupSpider({ data }: MuscleGroupSpiderProps) {
  const [timeframe, setTimeframe] = useState("2 weeks");

  // Mock data with realistic sets across all muscle groups
  const defaultData: MuscleData[] = [
    { muscle: "Chest", sets: 24 },
    { muscle: "Back", sets: 28 },
    { muscle: "Shoulders", sets: 18 },
    { muscle: "Arms", sets: 22 },
    { muscle: "Legs", sets: 16 },
    { muscle: "Core", sets: 20 },
  ];

  const muscleData = data || defaultData;
  const maxSets = Math.max(...muscleData.map((d) => d.sets));
  const totalSets = muscleData.reduce((sum, m) => sum + m.sets, 0);

  // Calculate stats based on timeframe
  const getStats = () => {
    switch (timeframe) {
      case "1 week":
        return {
          sets: Math.round(totalSets * 0.5),
          workouts: 4,
          avgPerWorkout: 21,
        };
      case "2 weeks":
        return { sets: totalSets, workouts: 8, avgPerWorkout: 16 };
      case "1 month":
        return { sets: totalSets * 2, workouts: 16, avgPerWorkout: 16 };
      case "2 months":
        return { sets: totalSets * 4, workouts: 32, avgPerWorkout: 16 };
      default:
        return { sets: totalSets, workouts: 8, avgPerWorkout: 16 };
    }
  };

  const stats = getStats();
  const size = 180; // Smaller since it's 60% of space
  const center = size / 2;
  const maxRadius = size / 2 - 20; // Reduced padding since no outer labels

  // Calculate points for each muscle group
  const points = muscleData.map((item, index) => {
    const angle = (index * 2 * Math.PI) / muscleData.length - Math.PI / 2;
    const radius = (item.sets / maxSets) * maxRadius;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    return { x, y, angle, label: item.muscle, sets: item.sets };
  });

  const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <Stack
      width="100%"
      backgroundColor="$backgroundSoft"
      borderRadius="$3"
      padding="$4"
      gap="$3"
    >
      {/* Header with timeframe selector */}
      <XStack justifyContent="space-between" alignItems="center">
        <Text fontSize="$5" fontWeight="600" color="$color">
          Muscle Balance
        </Text>

        <Select value={timeframe} onValueChange={setTimeframe}>
          <Select.Trigger width={120} iconAfter={ChevronDown}>
            <Select.Value placeholder="Timeframe" />
          </Select.Trigger>

          <Select.Content zIndex={200000}>
            <Select.ScrollUpButton />
            <Select.Viewport>
              <Select.Item index={0} value="1 week">
                <Select.ItemText>1 week</Select.ItemText>
              </Select.Item>
              <Select.Item index={1} value="2 weeks">
                <Select.ItemText>2 weeks</Select.ItemText>
              </Select.Item>
              <Select.Item index={2} value="1 month">
                <Select.ItemText>1 month</Select.ItemText>
              </Select.Item>
              <Select.Item index={3} value="2 months">
                <Select.ItemText>2 months</Select.ItemText>
              </Select.Item>
            </Select.Viewport>
            <Select.ScrollDownButton />
          </Select.Content>
        </Select>
      </XStack>

      {/* Main content area */}
      <XStack gap="$3" alignItems="center">
        {/* Left side - Stats */}
        <YStack flex={2} gap="$3">
          <YStack gap="$2">
            <YStack alignItems="center" gap="$0.5">
              <Text fontSize="$7" fontWeight="700" color="$primary">
                {stats.sets}
              </Text>
              <Text fontSize="$2" color="$textSoft" textAlign="center">
                Total Sets
              </Text>
            </YStack>

            <YStack alignItems="center" gap="$0.5">
              <Text fontSize="$5" fontWeight="600" color="$color">
                {stats.workouts}
              </Text>
              <Text fontSize="$2" color="$textSoft" textAlign="center">
                Workouts
              </Text>
            </YStack>

            <YStack alignItems="center" gap="$0.5">
              <Text fontSize="$4" fontWeight="600" color="$color">
                {stats.avgPerWorkout}
              </Text>
              <Text fontSize="$2" color="$textSoft" textAlign="center">
                Avg Sets/Workout
              </Text>
            </YStack>
          </YStack>

          {/* Top muscle groups */}
          <YStack gap="$1">
            <Text fontSize="$3" fontWeight="600" color="$color">
              Top Focus
            </Text>
            {muscleData
              .sort((a, b) => b.sets - a.sets)
              .slice(0, 3)
              .map((muscle, index) => (
                <XStack
                  key={muscle.muscle}
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Text fontSize="$2" color="$textSoft">
                    {index + 1}. {muscle.muscle}
                  </Text>
                  <Text fontSize="$2" fontWeight="600" color="$color">
                    {muscle.sets}
                  </Text>
                </XStack>
              ))}
          </YStack>
        </YStack>

        {/* Right side - Spider Chart */}
        <Stack flex={3} justifyContent="center" alignItems="center">
          <Svg width={size} height={size}>
            {/* Background grid circles */}
            {[0.25, 0.5, 0.75, 1.0].map((ratio, i) => (
              <Circle
                key={i}
                cx={center}
                cy={center}
                r={maxRadius * ratio}
                stroke="#e0e0e0"
                strokeWidth={1}
                fill="transparent"
                opacity={0.3}
              />
            ))}

            {/* Grid lines to each muscle group */}
            {points.map((point, index) => {
              const angle =
                (index * 2 * Math.PI) / muscleData.length - Math.PI / 2;
              const endX = center + maxRadius * Math.cos(angle);
              const endY = center + maxRadius * Math.sin(angle);
              return (
                <Line
                  key={index}
                  x1={center}
                  y1={center}
                  x2={endX}
                  y2={endY}
                  stroke="#e0e0e0"
                  strokeWidth={1}
                  opacity={0.3}
                />
              );
            })}

            {/* Data polygon */}
            <Polygon
              points={polygonPoints}
              fill="#f84f3e"
              fillOpacity={0.15}
              stroke="#f84f3e"
              strokeWidth={2}
            />

            {/* Data points */}
            {points.map((point, index) => (
              <Circle
                key={index}
                cx={point.x}
                cy={point.y}
                r={4}
                fill="#f84f3e"
              />
            ))}
          </Svg>

          {/* Muscle group legend below chart */}
          <XStack
            gap="$2"
            marginTop="$2"
            flexWrap="wrap"
            justifyContent="center"
          >
            {muscleData.map((muscle) => (
              <Text key={muscle.muscle} fontSize="$1" color="$textSoft">
                {muscle.muscle}
              </Text>
            ))}
          </XStack>
        </Stack>
      </XStack>
    </Stack>
  );
}
