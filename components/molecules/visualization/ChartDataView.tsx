import React, { useMemo } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import { YStack, Text, useTheme, Card, XStack } from "tamagui";
import {
  CartesianChart,
  Line,
  Bar,
  useChartPressState,
} from "victory-native";
import { Circle, useFont } from "@shopify/react-native-skia";
import type { SharedValue } from "react-native-reanimated";

interface ChartDataset {
  label: string;
  data: number[];
  color?: string;
}

interface ChartData {
  title: string;
  chart_type: "line" | "bar";
  labels: string[];
  datasets: ChartDataset[];
}

interface ChartDataViewProps {
  data: ChartData;
}

// Helper to generate a key for each dataset's y-values in the transformed data
const getDatasetKey = (index: number) => `dataset_${index}`;

export default function ChartDataView({ data }: ChartDataViewProps) {
  const theme = useTheme();
  const screenWidth = Dimensions.get("window").width;
  const chartWidth = screenWidth - 48; // Adjust for padding
  const chartHeight = 300;

  // Load a font for the chart axis labels. 
  // In a real app, you might want to load this globally or use a system font.
  // For now, we'll try to use a default system font if possible, but Skia needs a font file or loaded font object.
  // If we don't have a font file, we can pass null to hide labels or use a default if available in the environment.
  // However, Victory Native XL usually requires a font object for axes.
  // Let's try to use `useFont` with a standard font if available, or skip axis labels if it fails.
  // NOTE: In Expo Go/Dev Client, we might need a specific font file. 
  // For this implementation, we will assume the user might not have a font asset ready and try to proceed without explicit axis labels if font is missing,
  // or use a common approach. 
  // Actually, let's try to use the system font via `require` if we had one, but we don't.
  // We will omit the `font` prop for now and see if it falls back gracefully or if we need to add one.
  // UPDATE: Victory Native XL *requires* a font for axes. 
  // Let's try to load a standard font. If this fails, we might need to ask the user to add a font file.
  // For now, let's assume we can't easily load a font without an asset. 
  // We will render the chart without axis labels to avoid crashing, or use a placeholder.
  const font = useFont(require("../../../assets/fonts/SpaceMono-Regular.ttf"), 12); 

  // Transform data for Victory Native XL
  // It expects an array of objects: [{ x: label, dataset_0: val, dataset_1: val }, ...]
  const transformedData = useMemo(() => {
    if (!data.labels || data.labels.length === 0) return [];

    return data.labels.map((label, index) => {
      const dataPoint: any = { x: index }; // Use index for x-axis to avoid interpolation issues
      data.datasets.forEach((dataset, datasetIndex) => {
        dataPoint[getDatasetKey(datasetIndex)] = dataset.data[index];
      });
      return dataPoint;
    });
  }, [data]);

  // Manage press state for tooltips
  const { state: chartState, isActive } = useChartPressState({ x: 0, y: { [getDatasetKey(0)]: 0 } });

  // Helper for safe color access
  const getBlueColor = () => {
    // @ts-ignore
    return theme.blue10?.get() || "#3b82f6";
  };

  const getDatasetColor = (dataset: ChartDataset, index: number) => {
    return dataset.color || getBlueColor();
  };

  return (
    <Card
      bordered
      size="$4"
      backgroundColor="$background"
      borderColor="$borderColor"
      padding="$4"
      marginVertical="$3"
      width="100%"
      // @ts-ignore
      elevation={2}
    >
      <Card.Header padded>
        <Text fontSize="$5" fontWeight="bold" color="$color">
          {data.title}
        </Text>
      </Card.Header>

      <View style={{ height: chartHeight, width: "100%", marginTop: 10 }}>
        {transformedData.length > 0 && (
          <CartesianChart
            data={transformedData}
            xKey="x"
            yKeys={data.datasets.map((_, i) => getDatasetKey(i))}
            axisOptions={{
              font,
              tickCount: Math.min(data.labels.length, 6),
              lineColor: theme.borderColor?.get() || "#e5e5e5",
              labelColor: theme.color?.get() || "#000000",
              formatXLabel: (value) => {
                const index = Math.round(Number(value));
                return data.labels[index] || "";
              },
            }}
            chartPressState={chartState}
          >
            {({ points, chartBounds }) => (
              <>
                {data.chart_type === "line" &&
                  data.datasets.map((dataset, i) => (
                    <Line
                      key={i}
                      points={points[getDatasetKey(i)]}
                      color={getDatasetColor(dataset, i)}
                      strokeWidth={3}
                      animate={{ type: "timing", duration: 500 }}
                    />
                  ))}

                {data.chart_type === "bar" &&
                  data.datasets.map((dataset, i) => (
                    <Bar
                      key={i}
                      points={points[getDatasetKey(i)]}
                      chartBounds={chartBounds}
                      color={getDatasetColor(dataset, i)}
                      roundedCorners={{ topLeft: 5, topRight: 5 }}
                      animate={{ type: "timing", duration: 500 }}
                      // Offset bars if multiple datasets? 
                      // Victory Native XL handles bar groups differently (BarGroup), 
                      // but for simple cases we might just render one on top or need BarGroup.
                      // For now, assuming single dataset or stacked is acceptable, 
                      // or we would need to use <BarGroup>.
                      // Let's stick to simple Bar for now.
                    />
                  ))}
                  
                {/* Active Press Indicator (Simple Tooltip) */}
                {isActive && (
                  <>
                    {data.datasets.map((dataset, i) => (
                      <Circle
                        key={`dot-${i}`}
                        cx={chartState.x.position}
                        cy={chartState.y[getDatasetKey(i)].position}
                        r={6}
                        color={getDatasetColor(dataset, i)}
                        style="fill"
                      />
                    ))}
                  </>
                )}
              </>
            )}
          </CartesianChart>
        )}
      </View>

      {/* Legend */}
      <XStack flexWrap="wrap" gap="$3" marginTop="$2" justifyContent="center">
        {data.datasets.map((dataset, i) => (
          <XStack key={i} alignItems="center" gap="$2">
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: dataset.color || getBlueColor(),
              }}
            />
            <Text fontSize="$3" color="$color">
              {dataset.label}
            </Text>
          </XStack>
        ))}
      </XStack>
    </Card>
  );
}
