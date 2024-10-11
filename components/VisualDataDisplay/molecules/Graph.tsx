import React from 'react';
import { View, StyleSheet } from 'react-native';
import { VictoryLine, VictoryChart, VictoryTheme, VictoryAxis } from 'victory-native';

interface GraphProps {
  data: number[];
}

const Graph: React.FC<GraphProps> = ({ data }) => {
  const chartData = data.map((y, index) => ({ x: index + 1, y }));

  return (
    <View style={styles.container}>
      <VictoryChart theme={VictoryTheme.material} width={300} height={200}>
        <VictoryAxis 
          tickFormat={(t) => `${t}`}
          style={{
            axis: {stroke: "#ddd"},
            tickLabels: {fill: "#ddd"}
          }}
        />
        <VictoryAxis 
          dependentAxis
          style={{
            axis: {stroke: "#ddd"},
            tickLabels: {fill: "#ddd"}
          }}
        />
        <VictoryLine
          style={{
            data: { stroke: "#ddd" },
          }}
          data={chartData}
        />
      </VictoryChart>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#4a854a',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Graph;