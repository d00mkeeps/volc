import React from "react";
import { Stack } from "tamagui";
import Svg, { Polygon, Circle, Line, Text as SvgText } from "react-native-svg";

interface MuscleData {
  muscle: string;
  sets: number;
}

interface GraphStackProps {
  data?: MuscleData[];
}

export default function GraphStack({ data }: GraphStackProps) {
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
  const size = 250;
  const center = size / 2;
  const maxRadius = size / 2 - 40;

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
    <Stack flex={1} justifyContent="center" alignItems="flex-end">
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
              r={4}
              fill="#f84f3e"
            />
          ))}

          {/* Labels */}
          {points.map((point, index) => {
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
        </Svg>
      </Stack>
    </Stack>
  );
}
