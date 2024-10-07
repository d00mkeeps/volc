import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import WorkoutDisplayHeader from '../molecules/WorkoutDisplayHeader';
import WorkoutList from '../molecules/WorkoutList';
import { Workout } from '@/types';

interface WorkoutDisplayProps {
  workouts: Workout[];
}

const WorkoutDisplay: React.FC<WorkoutDisplayProps> = ({ workouts }) => {
  const [searchValue, setSearchValue] = useState('');
  const [filteredWorkouts, setFilteredWorkouts] = useState(workouts);

  useEffect(() => {
    const filtered = workouts.filter(workout => 
      workout.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      workout.description.toLowerCase().includes(searchValue.toLowerCase())
    );
    setFilteredWorkouts(filtered);
  }, [searchValue, workouts]);

  return (
    <View style={styles.container}>
      <WorkoutDisplayHeader 
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />
      <WorkoutList workouts={filteredWorkouts} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
});

export default WorkoutDisplay;