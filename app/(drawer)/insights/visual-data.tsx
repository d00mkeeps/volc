import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import VisualDataDisplay from '@/components/VisualDataDisplay/VisualDataDisplay'

export default function VisualDataScreen() {
  const [selectedExercise, setSelectedExercise] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('');
  const [data, setData] = useState<number[]>([]);

  const exercises = ['Squat', 'Bench Press', 'Deadlift', 'Overhead Press'];
  const timeframes = ['Last Week', 'Last Month', 'Last 3 Months', 'Last 6 Months', 'Last Year'];

  useEffect(() => {
    // Simulate data fetching when exercise and timeframe are selected
    if (selectedExercise && selectedTimeframe) {
      // In a real app, you would fetch data from an API or local database here
      const dummyData = [50, 60, 70, 80, 90, 100, 110].map(value => 
        value + Math.random() * 20 - 10
      );
      setData(dummyData);
    }
  }, [selectedExercise, selectedTimeframe]);

  return (
    <View style={styles.container}>
      <VisualDataDisplay
        exercises={exercises}
        selectedExercise={selectedExercise}
        onSelectExercise={setSelectedExercise}
        timeframes={timeframes}
        selectedTimeframe={selectedTimeframe}
        onSelectTimeframe={setSelectedTimeframe}
        data={data}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#222', // Adjust this to match your app's background color
  },
});