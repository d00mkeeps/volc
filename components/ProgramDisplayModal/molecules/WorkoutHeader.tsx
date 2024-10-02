import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WorkoutSelect } from '../atoms/WorkoutSelect';
import { Workout } from '@/types'; 

interface WorkoutHeaderProps {
  workouts: Workout[];
  selectedWorkout: Workout | null;
  onSelectWorkout: (workout: Workout) => void;
}

export const WorkoutHeader: React.FC<WorkoutHeaderProps> = ({ workouts, selectedWorkout, onSelectWorkout }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{selectedWorkout ? selectedWorkout.name : 'Select a workout'}</Text>
      <WorkoutSelect
        workouts={workouts.map(w => w.name)}
        selectedWorkout={selectedWorkout ? selectedWorkout.name : ''}
        onSelectWorkout={(workoutName) => {
          const workout = workouts.find(w => w.name === workoutName);
          if (workout) {
            onSelectWorkout(workout);
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#559e55',
    borderRadius: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ddd',
    marginBottom: 8,
  },
});