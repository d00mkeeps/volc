// TopButtonGroup.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ExerciseSelect } from '../atoms/ExerciseSelect';
import { TimeframeSelect } from '../atoms/TimeframeSelect';

interface TopButtonGroupProps {
  exercises: string[];
}

export const TopButtonGroup: React.FC<TopButtonGroupProps> = ({ exercises }) => {
  return (
    <View style={styles.container}>
      <ExerciseSelect exercises={exercises} />
      <TimeframeSelect />
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