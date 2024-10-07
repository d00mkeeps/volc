import React from 'react';
import { View, StyleSheet } from 'react-native';
import WorkoutDisplay from '@/components/workout/organisms/WorkoutDisplay';
import { sampleWorkouts } from '@/assets/mockData'; // Adjust the import path as needed

export default function WorkoutHistoryScreen() {

  const extendedWorkouts = Array(12).fill(sampleWorkouts).flat().map((workout, index) => ({
    ...workout,
    id: `${workout.id}-${index}`, // Ensure each workout has a unique id
    createdAt: new Date(Date.now() - index * 86400000).toISOString(), // Create different dates for each workout
  }));


  return (
    <View style={styles.container}>
      <WorkoutDisplay workouts={extendedWorkouts} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222', // Match the background color of WorkoutDisplay
  },
});
