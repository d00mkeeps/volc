import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { WorkoutHeader } from '../molecules/WorkoutHeader';
import { ExerciseList } from '../molecules/ExerciseList';
import { WorkoutDisplayProps } from '@/types';

export const WorkoutDisplay: React.FC<WorkoutDisplayProps> = ({ workout, onWorkoutChange, workouts }) => {
  if (!workout) {
    return (
      <View style={styles.container}>
        <Text style={styles.noWorkoutText}>No workout selected</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <WorkoutHeader
          workouts={workouts}
          selectedWorkout={workout}
          onSelectWorkout={onWorkoutChange}
        />
      </View>
      <ExerciseList workout={workout} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f281f',
  },
  headerContainer: {
    margin: 16,
  },
  noWorkoutText: {
    fontSize: 18,
    color: '#ddd',
    textAlign: 'center',
    marginTop: 20,
  },
});