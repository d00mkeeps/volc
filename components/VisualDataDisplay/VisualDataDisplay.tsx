import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TopButtonGroup } from './molecules/TopButtonGroup';
import { Graph } from './molecules/Graph';
import { VisualDataProvider } from './context/VisualDataContext';

export const VisualDataDisplay: React.FC = () => {
  const exercises = ['Exercise 1', 'Exercise 2', 'Exercise 3'];

  return ( 
    <VisualDataProvider>
      <View style={styles.container}>
        <TopButtonGroup exercises={exercises} />
        <Graph />
      </View>
    </VisualDataProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#4a854a',
    borderRadius: 10,
  },
});