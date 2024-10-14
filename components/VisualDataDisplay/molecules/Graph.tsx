// Graph.tsx
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { VictoryChart, VictoryLine, VictoryAxis, VictoryTheme, VictoryScatter } from 'victory-native';
import { useVisualData } from '../context/VisualDataContext';

const { width } = Dimensions.get('window');

export const Graph: React.FC = () => {
  const { timeframe } = useVisualData();

  const getTickValues = () => {
    const now = new Date();
    const ticks = [];
    switch (timeframe) {
      case 'last week':
        for (let i = 6; i >= 0; i--) {
          ticks.push(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i));
        }
        break;
      case 'last month':
        for (let i = 4; i >= 0; i--) {
          ticks.push(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 7));
        }
        break;
      case 'last 3 months':
        for (let i = 6; i >= 0; i--) {
          ticks.push(new Date(now.getFullYear(), now.getMonth() - i * 0.5, 1));
        }
        break;
      case 'last 6 months':
        for (let i = 6; i >= 0; i--) {
          ticks.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
        }
        break;
      case 'last year':
        for (let i = 6; i >= 0; i--) {
          ticks.push(new Date(now.getFullYear(), now.getMonth() - i * 2, 1));
        }
        break;
    }
    return ticks;
  };

  const getTickFormat = () => {
    switch (timeframe) {
      case 'last week':
        return (date: Date) => date.toLocaleDateString(undefined, { weekday: 'short' });
      case 'last month':
        return (date: Date) => `Week ${Math.ceil(date.getDate() / 7)}`;
      case 'last 3 months':
      case 'last 6 months':
        return (date: Date) => date.toLocaleDateString(undefined, { month: 'short' });
      case 'last year':
        return (date: Date) => date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
    }
  };

  const tickValues = getTickValues();
  const tickFormat = getTickFormat();

  // Dummy data for visualization
  const dummyData = tickValues.map((date, index) => ({
    x: date,
    y: Math.random() * 100 + 50 // Random value between 50 and 150
  }));

  return (
    <View style={styles.container}>
      <VictoryChart
        theme={VictoryTheme.material}
        width={width - 40}
        height={300}
        scale={{ x: 'time' }}
        domain={{ x: [tickValues[0], tickValues[tickValues.length - 1]] }}
        padding={{ top: 10, bottom: 50, left: 50, right: 20 }}
      >
        <VictoryAxis
          tickValues={tickValues}
          tickFormat={tickFormat}
          style={{
            axis: { stroke: '#ddd' },
            tickLabels: { fill: '#ddd', fontSize: 10, angle: 45, textAnchor: 'start' },
            grid: { stroke: '#ddd', strokeWidth: 0.5 }
          }}
        />
        <VictoryAxis
          dependentAxis
          style={{
            axis: { stroke: '#ddd' },
            tickLabels: { fill: '#ddd', fontSize: 10 },
            grid: { stroke: '#ddd', strokeWidth: 0.5 }
          }}
        />
        <VictoryLine
          data={dummyData}
          style={{ data: { stroke: 'white' } }}
        />
        <VictoryScatter
          data={dummyData}
          size={4}
          style={{ data: { fill: 'white' } }}
        />
      </VictoryChart>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#559e55',
    borderRadius: 10,
    padding: 10,
  },
});