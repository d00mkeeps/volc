import React from 'react';
import { View, StyleSheet } from 'react-native';
import WorkoutDisplay from '@/components/workout/organisms/WorkoutDisplay';
import { sampleWorkout } from '@/assets/mockData'; // Adjust the import path as needed

export default function WorkoutHistoryScreen() {
  // For demonstration purposes, we're creating an array with multiple copies of sampleWorkout
  // In a real app, you'd fetch this data from your backend or local storage
  const workouts = Array(10).fill(sampleWorkout).map((workout, index) => ({
    ...workout,
    id: `${workout.id}-${index}`, // Ensure each workout has a unique id
    createdAt: new Date(Date.now() - index * 86400000).toISOString(), // Create different dates for each workout
  }));

  return (
    <View style={styles.container}>
      <WorkoutDisplay workouts={workouts} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222', // Match the background color of WorkoutDisplay
  },
});
