import React, { useState } from "react";
import { Stack } from "tamagui";
import Svg, { Polygon, Circle, Line, Text as SvgText } from "react-native-svg";
import Select from "@/components/atoms/Select";
import MetricsDisplay from "./MetricsDisplay";
import { TimeframeData, MuscleData, AllTimeframeData } from "@/types/workout";

interface MuscleGroupSpiderProps {
  allData: AllTimeframeData;
}

type TimeframeKey = "1week" | "2weeks" | "1month" | "2months";

export default function MuscleGroupSpider({ allData }: MuscleGroupSpiderProps) {
  const [timeframe, setTimeframe] = useState<TimeframeKey>("2weeks");

  // Get data for current timeframe selection - now properly typed
  const currentData: TimeframeData = allData[timeframe];
  const muscleData: MuscleData[] = currentData.muscleBalance;

  // Calculate metrics based on current data - with explicit types
  const totalSets = muscleData.reduce(
    (sum: number, m: MuscleData) => sum + m.sets,
    0
  );
  const estimatedExercises =
    muscleData.length > 0
      ? muscleData.reduce(
          (sum: number, m: MuscleData) => sum + Math.ceil(m.sets / 3),
          0
        )
      : 0;

  const metrics = [
    { label: "Workouts", value: currentData.consistency.totalWorkouts },
    { label: "Exercises", value: estimatedExercises },
    { label: "Sets", value: totalSets },
  ];

  const timeframeOptions = [
    { value: "1week", label: "1 Week" },
    { value: "2weeks", label: "2 Weeks" },
    { value: "1month", label: "1 Month" },
    { value: "2months", label: "2 Months" },
  ];

  // Use real data or fallback to empty state
  const maxSets =
    muscleData.length > 0
      ? Math.max(...muscleData.map((d: MuscleData) => d.sets))
      : 1;
  const size = 220;
  const center = size / 2;
  const maxRadius = size / 2 - 40;

  const points = muscleData.map((item: MuscleData, index: number) => {
    const angle = (index * 2 * Math.PI) / muscleData.length - Math.PI / 2;
    const radius = (item.sets / maxSets) * maxRadius;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    return { x, y, angle, label: item.muscle, sets: item.sets };
  });

  const polygonPoints = points.map((p: any) => `${p.x},${p.y}`).join(" ");

  const handleTimeframeChange = (value: string) => {
    // Type guard to ensure we only set valid timeframe values
    if (
      value === "1week" ||
      value === "2weeks" ||
      value === "1month" ||
      value === "2months"
    ) {
      setTimeframe(value);
    }
  };

  return (
    <Stack
      width="100%"
      height={230}
      backgroundColor="$backgroundSoft"
      borderRadius="$3"
      flexDirection="row"
      paddingRight="$1.5"
    >
      {/* Left Stack - Data Display Area */}
      <Stack flex={0.5} backgroundColor="$backgroundSoft" gap="$2" padding="$2">
        {/* Timeframe Select - updates component state only */}
        <Select
          options={timeframeOptions}
          value={timeframe}
          onValueChange={handleTimeframeChange}
        />

        <MetricsDisplay metrics={metrics} />
      </Stack>

      {/* Right Stack - Spider Chart */}
      <Stack flex={1} justifyContent="center" alignItems="flex-end">
        <Stack justifyContent="center" alignItems="center">
          <Svg width={size} height={size}>
            {/* Background grid circles */}
            {[0.25, 0.5, 0.75, 1.0].map((ratio: number, i: number) => (
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
            {points.map((point: any, index: number) => {
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

            {/* Only render polygon and points if we have data */}
            {muscleData.length > 0 && (
              <>
                <Polygon
                  points={polygonPoints}
                  fill="#f84f3e"
                  fillOpacity={0.15}
                  stroke="#f84f3e"
                  strokeWidth={2}
                />

                {points.map((point: any, index: number) => (
                  <Circle
                    key={index}
                    cx={point.x}
                    cy={point.y}
                    r={4}
                    fill="#f84f3e"
                  />
                ))}

                {points.map((point: any, index: number) => {
                  const angle =
                    (index * 2 * Math.PI) / muscleData.length - Math.PI / 2;
                  const labelRadius = maxRadius + 24;
                  const labelX = center + labelRadius * Math.cos(angle);
                  const labelY = center + labelRadius * Math.sin(angle);

                  return (
                    <SvgText
                      key={index}
                      x={labelX}
                      y={labelY}
                      fontSize="11"
                      fill="#6b6466"
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      fontWeight="500"
                    >
                      {point.label}
                    </SvgText>
                  );
                })}
              </>
            )}
          </Svg>
        </Stack>
      </Stack>
    </Stack>
  );
}
