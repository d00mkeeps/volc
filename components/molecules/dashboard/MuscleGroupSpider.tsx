import React from "react";
import { Stack, Text, YStack } from "tamagui";
import Svg, { Polygon, Circle, Line, Text as SvgText } from "react-native-svg";

interface MuscleData {
  muscle: string;
  sets: number;
}

interface MuscleGroupSpiderProps {
  data?: MuscleData[];
}

export default function MuscleGroupSpider({ data }: MuscleGroupSpiderProps) {
  // Mock data with realistic 2-week sets across all muscle groups
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
  const size = 180;
  const center = size / 2;
  const maxRadius = size / 2 - 30;

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
      width={240}
      height={200}
      backgroundColor="$backgroundSoft"
      borderRadius="$3"
      padding="$3"
      justifyContent="center"
      alignItems="center"
      gap="$1.5"
    >
      {/* Title */}
      <Text fontSize="$4" fontWeight="600" color="$color" textAlign="center">
        Muscle Balance
      </Text>

      {/* Spider Chart */}
      <Stack justifyContent="center" alignItems="center">
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
              r={3}
              fill="#f84f3e"
            />
          ))}

          {/* Labels */}
          {points.map((point, index) => {
            const angle =
              (index * 2 * Math.PI) / muscleData.length - Math.PI / 2;
            const labelRadius = maxRadius + 18;
            const labelX = center + labelRadius * Math.cos(angle);
            const labelY = center + labelRadius * Math.sin(angle);

            return (
              <SvgText
                key={index}
                x={labelX}
                y={labelY}
                fontSize="9"
                fill="#6b6466"
                textAnchor="middle"
                alignmentBaseline="middle"
                fontWeight="500"
              >
                {point.label}
              </SvgText>
            );
          })}
        </Svg>
      </Stack>

      {/* Summary stats */}
      <YStack alignItems="center" gap="$0.5">
        <Text fontSize="$2" color="$colorPress" textAlign="center">
          Last 2 weeks
        </Text>
        <Text fontSize="$2" color="$textSoft" textAlign="center">
          {muscleData.reduce((sum, m) => sum + m.sets, 0)} total sets
        </Text>
      </YStack>
    </Stack>
  );
}
