import React from 'react';
import { View, StyleSheet } from 'react-native';
import Graph from '../molecules/Graph';
import Legend from '../molecules/Legend';

interface GraphDisplayProps {
  data: number[];
}

const GraphDisplay: React.FC<GraphDisplayProps> = ({ data }) => {
  return (
    <View style={styles.container}>
      <Graph data={data} />
      <Legend />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
});

export default GraphDisplay;