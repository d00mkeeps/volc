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
      {selectedWorkout && (
        <Text style={styles.description}>{selectedWorkout.description}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#559e55', // Light green background
    borderRadius: 20,
    padding: 16,
  },
  description: {
    fontSize: 16,
    color: '#1f281f',
    marginTop: 12,
  },
});