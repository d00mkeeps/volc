// /components/molecules/dashboard/MuscleGroupSpider.tsx

import React, { useState, useMemo } from "react";
import { Stack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import {
  Canvas,
  Path,
  Circle,
  Text as SkiaText,
  useFont,
  Skia,
  vec,
  Group,
} from "@shopify/react-native-skia";
import Select from "@/components/atoms/core/Select";
import MetricsDisplay from "./MetricsDisplay";
import { TimeframeData, MuscleData } from "@/types/workout";
import { useDashboardStore } from "@/stores/dashboardStore";

type TimeframeKey = "1week" | "2weeks" | "1month" | "2months";

export default function MuscleGroupSpider() {
  const [timeframe, setTimeframe] = useState<TimeframeKey>("2weeks");

  const allData = useDashboardStore((state) => state.allData);
  const isLoading = useDashboardStore((state) => state.isLoading);
  const error = useDashboardStore((state) => state.error);

  const font = useFont(
    require("../../../assets/fonts/SpaceMono-Regular.ttf"),
    12
  );

  const calculateDisabledTimeframes = () => {
    if (!allData) return [];

    const timeframeOrder: TimeframeKey[] = [
      "1week",
      "2weeks",
      "1month",
      "2months",
    ];
    const disabled: TimeframeKey[] = [];

    for (let i = 0; i < timeframeOrder.length - 1; i++) {
      const currentKey = timeframeOrder[i];
      const nextKey = timeframeOrder[i + 1];

      const currentWorkouts = allData[currentKey]?.actualMetrics?.workouts || 0;
      const nextWorkouts = allData[nextKey]?.actualMetrics?.workouts || 0;

      if (nextWorkouts === currentWorkouts) {
        disabled.push(nextKey);
      }
    }

    return disabled;
  };

  const disabledTimeframes = calculateDisabledTimeframes();

  const timeframeOptions = [
    {
      value: "1week",
      label: "1 Week",
      disabled: disabledTimeframes.includes("1week"),
    },
    {
      value: "2weeks",
      label: "2 Weeks",
      disabled: disabledTimeframes.includes("2weeks"),
    },
    {
      value: "1month",
      label: "1 Month",
      disabled: disabledTimeframes.includes("1month"),
    },
    {
      value: "2months",
      label: "2 Months",
      disabled: disabledTimeframes.includes("2months"),
    },
  ];

  if (isLoading) {
    return (
      <Stack
        width="100%"
        height={230}
        backgroundColor="$backgroundSoft"
        borderRadius="$3"
        flexDirection="row"
        paddingRight="$1.5"
        justifyContent="center"
        alignItems="center"
      >
        <Text color="$textSoft">Loading dashboard...</Text>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack
        width="100%"
        height={230}
        backgroundColor="$backgroundSoft"
        borderRadius="$3"
        flexDirection="row"
        paddingRight="$1.5"
        justifyContent="center"
        alignItems="center"
      >
        <Text color="$red">Error: {error}</Text>
      </Stack>
    );
  }

  if (!allData) {
    return (
      <Stack
        width="100%"
        height={230}
        backgroundColor="$backgroundSoft"
        borderRadius="$3"
        flexDirection="row"
        paddingRight="$1.5"
        justifyContent="center"
        alignItems="center"
      >
        <Text color="$textSoft">No data available</Text>
      </Stack>
    );
  }

  const currentData: TimeframeData | undefined = allData[timeframe];
  if (!currentData) {
    return (
      <Stack
        width="100%"
        height={230}
        backgroundColor="$backgroundSoft"
        borderRadius="$3"
        flexDirection="row"
        paddingRight="$1.5"
        justifyContent="center"
        alignItems="center"
      >
        <Text color="$textSoft">No data for selected timeframe</Text>
      </Stack>
    );
  }

  const muscleData: MuscleData[] = currentData.muscleBalance || [];

  const maxSets =
    muscleData.length > 0
      ? Math.max(...muscleData.map((d: MuscleData) => d.sets))
      : 1;
  const size = 260;
  const center = size / 2;
  const maxRadius = 80;

  const points = useMemo(() => {
    return muscleData.map((item: MuscleData, index: number) => {
      const angle = (index * 2 * Math.PI) / muscleData.length - Math.PI / 2;
      const radius = (item.sets / maxSets) * maxRadius;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      return { x, y, angle, label: item.muscle, sets: item.sets };
    });
  }, [muscleData, maxSets, center, maxRadius]);

  const polygonPath = useMemo(() => {
    const path = Skia.Path.Make();
    if (points.length > 0) {
      path.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        path.lineTo(points[i].x, points[i].y);
      }
      path.close();
    }
    return path;
  }, [points]);

  const handleTimeframeChange = (value: string) => {
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
      <Stack flex={0.5} backgroundColor="$backgroundSoft" gap="$2" padding="$2">
        <Stack>
          <Select
            options={timeframeOptions}
            value={timeframe}
            onValueChange={handleTimeframeChange}
          />
        </Stack>

        <MetricsDisplay actualMetrics={currentData.actualMetrics} />
      </Stack>

      <Stack flex={1} justifyContent="center">
        <Stack justifyContent="center" alignItems="center">
          <Canvas style={{ width: size, height: size }}>
            <Group>
              {[0.25, 0.5, 0.75, 1.0].map((ratio: number, i: number) => (
                <Circle
                  key={i}
                  cx={center}
                  cy={center}
                  r={maxRadius * ratio}
                  style="stroke"
                  strokeWidth={1}
                  color="#ef4444"
                  opacity={0.3}
                />
              ))}

              {points.map((point: any, index: number) => {
                const angle =
                  (index * 2 * Math.PI) / muscleData.length - Math.PI / 2;
                const endX = center + maxRadius * Math.cos(angle);
                const endY = center + maxRadius * Math.sin(angle);
                const path = Skia.Path.Make();
                path.moveTo(center, center);
                path.lineTo(endX, endY);

                return (
                  <Path
                    key={`grid-line-${index}`}
                    path={path}
                    style="stroke"
                    strokeWidth={1}
                    color="#ef4444"
                    opacity={0.3}
                  />
                );
              })}

              {muscleData.length > 0 && (
                <>
                  <Path
                    path={polygonPath}
                    color="#f84f3e"
                    style="fill"
                    opacity={0.15}
                  />
                  <Path
                    path={polygonPath}
                    color="#f84f3e"
                    style="stroke"
                    strokeWidth={2}
                  />

                  {points.map((point: any, index: number) => (
                    <Circle
                      key={`point-${index}`}
                      cx={point.x}
                      cy={point.y}
                      r={3}
                      color="#f84f3e"
                      style="fill"
                    />
                  ))}

                  {points.map((point: any, index: number) => {
                    const angle =
                      (index * 2 * Math.PI) / muscleData.length - Math.PI / 2;
                    const labelRadius = maxRadius + 16;
                    const labelX = center + labelRadius * Math.cos(angle);
                    const labelY = center + labelRadius * Math.sin(angle);

                    const textWidth = font ? font.getTextWidth(point.label) : 0;
                    const adjustedX = labelX - textWidth / 2;
                    const adjustedY = labelY + 4;

                    if (!font) return null;

                    return (
                      <SkiaText
                        key={`label-${index}`}
                        x={adjustedX}
                        y={adjustedY}
                        text={point.label}
                        font={font}
                        color="#6b6466"
                      />
                    );
                  })}
                </>
              )}
            </Group>
          </Canvas>
        </Stack>
      </Stack>
    </Stack>
  );
}
