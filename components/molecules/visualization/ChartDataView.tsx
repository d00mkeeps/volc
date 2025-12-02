import React, { useMemo } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import { YStack, Text, useTheme, Card, XStack } from "tamagui";
import {
  CartesianChart,
  Line,
  Bar,
} from "victory-native";
import { useFont } from "@shopify/react-native-skia";
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

// Forward-fill helper: carries last known value forward to fill gaps
const forwardFillDataset = (data: (number | null)[]): (number | null)[] => {
  const result = [...data];
  let lastValue: number | null = null;
  
  for (let i = 0; i < result.length; i++) {
    if (result[i] != null) {
      lastValue = result[i];
    } else if (lastValue != null) {
      result[i] = lastValue; // Carry forward last known value
    }
  }
  
  return result;
};

// Normalize to percentage change from first value
const normalizeToPercentage = (dataArray: (number | null)[]): (number | null)[] => {
  const firstValue = dataArray.find((v): v is number => v != null);
  if (!firstValue || firstValue === 0) return dataArray; // Can't normalize from 0
  
  return dataArray.map(v => {
    if (v == null) return null;
    return ((v - firstValue) / firstValue) * 100; // % change
  });
};

export default function ChartDataView({ data }: ChartDataViewProps) {
  const theme = useTheme();
  const screenWidth = Dimensions.get("window").width;
  const chartWidth = screenWidth - 48; // Adjust for padding
  const chartHeight = 300;

  const font = useFont(require("../../../assets/fonts/SpaceMono-Regular.ttf"), 12); 

  // Detect if we need percentage normalization (scales differ by >3x)
  const shouldNormalizeToPercentage = useMemo(() => {
    if (data.datasets.length <= 1) return false;
    
    const maxValues = data.datasets
      .map(ds => Math.max(...ds.data.filter((v): v is number => v != null)))
      .filter(v => !isNaN(v) && isFinite(v));
    
    if (maxValues.length < 2) return false;
    
    const minMax = Math.min(...maxValues);
    const maxMax = Math.max(...maxValues);
    const ratio = maxMax / minMax;
    
    return ratio > 3; // Normalize if scales differ by more than 3x
  }, [data.datasets]);

  // Apply forward-fill and optional percentage normalization
  const processedDatasets = useMemo(() => {
    return data.datasets.map(dataset => {
      let processedData = forwardFillDataset(dataset.data);
      
      if (shouldNormalizeToPercentage) {
        processedData = normalizeToPercentage(processedData);
      }
      
      return {
        ...dataset,
        data: processedData
      };
    });
  }, [data.datasets, shouldNormalizeToPercentage]);

  // Transform processed data for Victory Native
  const transformedData = useMemo(() => {
    if (!data.labels || data.labels.length === 0) return [];

    return data.labels.map((label, index) => {
      const dataPoint: any = { x: index };
      processedDatasets.forEach((dataset, datasetIndex) => {
        dataPoint[getDatasetKey(datasetIndex)] = dataset.data[index] ?? null;
      });
      return dataPoint;
    });
  }, [data.labels, processedDatasets]);

  // Calculate Y-axis bounds
  const allValues = useMemo(() => {
    return processedDatasets.flatMap((d) => d.data).filter((v): v is number => v != null);
  }, [processedDatasets]);

  const yDomain = useMemo(() => {
    if (allValues.length === 0) return undefined;
    const minVal = Math.min(...allValues);
    const maxVal = Math.max(...allValues);
    const range = Math.abs(maxVal - minVal);
    const padding = range > 0 ? range * 0.1 : 10;
    
    return [minVal - padding, maxVal + padding] as [number, number];
  }, [allValues]);

  // Update chart title for percentage mode
const chartTitle = useMemo(() => {
  if (shouldNormalizeToPercentage && !data.title.includes("% Change")) {
    return `${data.title} (% Change)`;
  }
  return data.title;
}, [data.title, shouldNormalizeToPercentage]);
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
          {chartTitle}
        </Text>
      </Card.Header>

      <View style={{ height: chartHeight, width: "100%", marginTop: 10 }}>
        {transformedData.length > 0 && (
          <CartesianChart
            data={transformedData}
            xKey="x"
            yKeys={data.datasets.map((_, i) => getDatasetKey(i))}
            domain={yDomain ? { y: yDomain } : undefined}
            axisOptions={{
              font,
              tickCount: Math.min(data.labels.length, 6),
              lineColor: theme.borderColor?.get() || "#e5e5e5",
              labelColor: theme.color?.get() || "#000000",
              formatXLabel: (value) => {
                const index = Math.round(Number(value));
                return data.labels[index] || "";
              },
              formatYLabel: (value) => {
                if (shouldNormalizeToPercentage) {
                  return `${Number(value).toFixed(0)}%`;
                }
                return `${Number(value).toFixed(0)}`;
              },
            }}
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
                    />
                  ))}
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