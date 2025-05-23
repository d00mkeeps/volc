// components/molecules/MuscleGroupSpider.tsx
import React from "react";
import { Stack, Text } from "tamagui";
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
    { muscle: "Biceps", sets: 16 },
    { muscle: "Triceps", sets: 20 },
    { muscle: "Quads", sets: 14 },
    { muscle: "Hamstrings", sets: 12 },
    { muscle: "Glutes", sets: 10 },
    { muscle: "Abs", sets: 22 },
    { muscle: "Forearms", sets: 8 },
    { muscle: "Cardio", sets: 6 },
  ];

  const muscleData = data || defaultData;
  const maxSets = Math.max(...muscleData.map((d) => d.sets));
  const size = 220; // Increased SVG size to accommodate labels
  const center = size / 2;
  const maxRadius = size / 2 - 35; // Increased margin for labels

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
      height={240}
      backgroundColor="$backgroundSoft"
      borderRadius="$4"
      padding="$3"
      justifyContent="center"
      alignItems="center"
      gap="$2"
    >
      <Text fontSize="$4" fontWeight="600" color="$color" textAlign="center">
        Muscle Balance
      </Text>

      <Stack justifyContent="center" alignItems="center">
        <Svg width={size} height={size}>
          {/* Background grid circles */}
          {[0.2, 0.4, 0.6, 0.8, 1.0].map((ratio, i) => (
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
            fill="#007AFF"
            fillOpacity={0.15}
            stroke="#007AFF"
            strokeWidth={2}
          />

          {/* Data points */}
          {points.map((point, index) => (
            <Circle
              key={index}
              cx={point.x}
              cy={point.y}
              r={2.5}
              fill="#007AFF"
            />
          ))}

          {/* Labels */}
          {points.map((point, index) => {
            const angle =
              (index * 2 * Math.PI) / muscleData.length - Math.PI / 2;
            const labelRadius = maxRadius + 20; // Slightly increased label distance
            const labelX = center + labelRadius * Math.cos(angle);
            const labelY = center + labelRadius * Math.sin(angle);

            return (
              <SvgText
                key={index}
                x={labelX}
                y={labelY}
                fontSize="8"
                fill="#666666"
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {point.label}
              </SvgText>
            );
          })}
        </Svg>
      </Stack>
    </Stack>
  );
}
