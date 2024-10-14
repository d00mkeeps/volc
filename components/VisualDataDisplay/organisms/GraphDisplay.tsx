import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Graph } from '../molecules/Graph';
import { Legend } from '../molecules/Legend';

export const GraphDisplay: React.FC = () => {
  return (
    <View style={styles.container}>
      <Graph />
      <Legend />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
});