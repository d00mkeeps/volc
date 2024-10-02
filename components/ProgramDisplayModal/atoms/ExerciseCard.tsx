import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ExerciseCardProps } from '@/types'; 

export const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{exercise.name}</Text>
      <Text style={styles.description}>{exercise.description}</Text>
      <View style={styles.detailsContainer}>
        {exercise.sets && <Text style={styles.detail}>Sets: {exercise.sets}</Text>}
        {exercise.reps && <Text style={styles.detail}>Reps: {exercise.reps}</Text>}
        {exercise.duration && <Text style={styles.detail}>Duration: {exercise.duration}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#4a854a',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ddd',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#ddd',
    marginBottom: 8,
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  detail: {
    fontSize: 14,
    color: '#bbb',
    marginRight: 8,
  },
});