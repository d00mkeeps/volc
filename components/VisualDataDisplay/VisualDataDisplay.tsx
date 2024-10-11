import React from 'react';
import { View, StyleSheet } from 'react-native';
import TopButtonGroup from './molecules/TopButtonGroup';
import GraphDisplay from './organisms/GraphDisplay';

interface VisualDataDisplayProps {
  exercises: string[];
  selectedExercise: string;
  onSelectExercise: (exercise: string) => void;
  timeframes: string[];
  selectedTimeframe: string;
  onSelectTimeframe: (timeframe: string) => void;
  data: number[];
}

const VisualDataDisplay: React.FC<VisualDataDisplayProps> = ({
  exercises,
  selectedExercise,
  onSelectExercise,
  timeframes,
  selectedTimeframe,
  onSelectTimeframe,
  data,
}) => {
  return (
    <View style={styles.container}>
      <TopButtonGroup
        exercises={exercises}
        selectedExercise={selectedExercise}
        onSelectExercise={onSelectExercise}
        timeframes={timeframes}
        selectedTimeframe={selectedTimeframe}
        onSelectTimeframe={onSelectTimeframe}
      />
      <GraphDisplay data={data} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#559e55',
    borderRadius: 20,
  },
});

export default VisualDataDisplay;