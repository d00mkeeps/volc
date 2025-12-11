import React, { useMemo, memo } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import { YStack, Text, useTheme, Card, XStack } from "tamagui";
import { CartesianChart, Line, Bar } from "victory-native";
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

const getDatasetKey = (index: number) => `dataset_${index}`;

const forwardFillDataset = (data: (number | null)[]): (number | null)[] => {
  const result = [...data];
  let lastValue: number | null = null;

  for (let i = 0; i < result.length; i++) {
    if (result[i] != null) {
      lastValue = result[i];
    } else if (lastValue != null) {
      result[i] = lastValue;
    }
  }

  return result;
};

const normalizeToPercentage = (
  dataArray: (number | null)[]
): (number | null)[] => {
  const firstValue = dataArray.find((v): v is number => v != null);
  if (!firstValue || firstValue === 0) return dataArray;

  return dataArray.map((v) => {
    if (v == null) return null;
    return ((v - firstValue) / firstValue) * 100;
  });
};

function ChartDataView({ data }: ChartDataViewProps) {
  const theme = useTheme();
  const screenWidth = Dimensions.get("window").width;
  const chartHeight = 300;

  const font = useFont(
    require("../../../assets/fonts/SpaceMono-Regular.ttf"),
    12
  );

  const shouldNormalizeToPercentage = useMemo(() => {
    if (data.datasets.length <= 1) return false;

    const maxValues = data.datasets
      .map((ds) => Math.max(...ds.data.filter((v): v is number => v != null)))
      .filter((v) => !isNaN(v) && isFinite(v));

    if (maxValues.length < 2) return false;

    const minMax = Math.min(...maxValues);
    const maxMax = Math.max(...maxValues);
    const ratio = maxMax / minMax;

    return ratio > 3;
  }, [data.datasets]);

  const processedDatasets = useMemo(() => {
    return data.datasets.map((dataset) => {
      let processedData = forwardFillDataset(dataset.data);

      if (shouldNormalizeToPercentage) {
        processedData = normalizeToPercentage(processedData);
      }

      return {
        ...dataset,
        data: processedData,
      };
    });
  }, [data.datasets, shouldNormalizeToPercentage]);

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

  const allValues = useMemo(() => {
    return processedDatasets
      .flatMap((d) => d.data)
      .filter((v): v is number => v != null);
  }, [processedDatasets]);

  const yDomain = useMemo(() => {
    if (allValues.length === 0) return undefined;
    const minVal = Math.min(...allValues);
    const maxVal = Math.max(...allValues);
    const range = Math.abs(maxVal - minVal);
    const padding = range > 0 ? range * 0.1 : 10;

    return [minVal - padding, maxVal + padding] as [number, number];
  }, [allValues]);

  const chartTitle = useMemo(() => {
    if (shouldNormalizeToPercentage && !data.title.includes("% Change")) {
      return `${data.title} (% Change)`;
    }
    return data.title;
  }, [data.title, shouldNormalizeToPercentage]);

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

export default memo(ChartDataView, (prev, next) => {
  return (
    prev.data.title === next.data.title &&
    prev.data.chart_type === next.data.chart_type &&
    JSON.stringify(prev.data.labels) === JSON.stringify(next.data.labels) &&
    JSON.stringify(prev.data.datasets) === JSON.stringify(next.data.datasets)
  );
});
