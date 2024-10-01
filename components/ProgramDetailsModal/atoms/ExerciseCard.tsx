import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/Themed';
import { ExerciseCardProps } from '@/types';

export const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise }) => (
  <View style={styles.card}>
    <Text style={styles.exerciseName}>{exercise.name}</Text>
    <Text style={styles.exerciseDescription}>{exercise.description}</Text>
    {exercise.sets && <Text style={styles.exerciseDetail}>Sets: {exercise.sets}</Text>}
    {exercise.reps && <Text style={styles.exerciseDetail}>Reps: {exercise.reps}</Text>}
    {exercise.duration && <Text style={styles.exerciseDetail}>Duration: {exercise.duration}</Text>}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2f3f2f',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ddd',
    marginBottom: 5,
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#bbb',
    marginBottom: 10,
  },
  exerciseDetail: {
    fontSize: 14,
    color: '#aaa',
  },
});