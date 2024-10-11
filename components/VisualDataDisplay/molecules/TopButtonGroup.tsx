import React from 'react';
import { View, StyleSheet } from 'react-native';
import ExerciseSelect from '../atoms/ExerciseSelect';
import TimeframeSelect from '../atoms/TimeframeSelect';

interface TopButtonGroupProps {
  exercises: string[];
  selectedExercise: string;
  onSelectExercise: (exercise: string) => void;
  timeframes: string[];
  selectedTimeframe: string;
  onSelectTimeframe: (timeframe: string) => void;
}

const TopButtonGroup: React.FC<TopButtonGroupProps> = ({
  exercises,
  selectedExercise,
  onSelectExercise,
  timeframes,
  selectedTimeframe,
  onSelectTimeframe,
}) => {
  return (
    <View style={styles.container}>
      <ExerciseSelect
        exercises={exercises}
        selectedExercise={selectedExercise}
        onSelectExercise={onSelectExercise}
      />
      <TimeframeSelect
        timeframes={timeframes}
        selectedTimeframe={selectedTimeframe}
        onSelectTimeframe={onSelectTimeframe}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
});

export default TopButtonGroup;