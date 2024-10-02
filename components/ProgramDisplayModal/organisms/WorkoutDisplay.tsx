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
      <WorkoutHeader
        workouts={workouts}
        selectedWorkout={workout}
        onSelectWorkout={onWorkoutChange}
      />
      <View style={styles.descriptionContainer}>
        <Text style={styles.description}>{workout.description}</Text>
      </View>
      <ExerciseList workout={workout} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#559e55',
  },
  descriptionContainer: {
    padding: 16,
    backgroundColor: '#4a854a',
    borderRadius: 10,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  description: {
    fontSize: 16,
    color: '#ddd',
  },
  noWorkoutText: {
    fontSize: 18,
    color: '#ddd',
    textAlign: 'center',
    marginTop: 20,
  },
});