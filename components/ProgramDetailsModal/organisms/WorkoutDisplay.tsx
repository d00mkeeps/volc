import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from '@/components/Themed';
import { ExerciseCard } from '../atoms/ExerciseCard';
import { WorkoutDisplayProps } from '@/types';

export const WorkoutDisplay: React.FC<WorkoutDisplayProps> = ({ workout }) => (
  <ScrollView style={styles.container}>
    <Text style={styles.workoutTitle}>{workout.name}</Text>
    <Text style={styles.workoutDescription}>{workout.description}</Text>
    {workout.exercises.map((exercise) => (
      <ExerciseCard key={exercise.id} exercise={exercise} />
    ))}
  </ScrollView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  workoutTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ddd',
    marginBottom: 10,
  },
  workoutDescription: {
    fontSize: 16,
    color: '#bbb',
    marginBottom: 20,
  },
});