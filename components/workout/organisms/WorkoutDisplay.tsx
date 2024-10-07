
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import WorkoutDisplayHeader from '../molecules/WorkoutDisplayHeader';
import WorkoutList from '../molecules/WorkoutList';
import { Workout } from '@/types';

interface WorkoutDisplayProps {
  workouts: Workout[];
}

const ITEMS_PER_PAGE = 20;

const WorkoutDisplay: React.FC<WorkoutDisplayProps> = ({ workouts }) => {
  const [searchValue, setSearchValue] = useState('');
  const [filteredWorkouts, setFilteredWorkouts] = useState(workouts);
  const [displayedWorkouts, setDisplayedWorkouts] = useState<Workout[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const filtered = workouts.filter(workout => 
      workout.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      workout.description.toLowerCase().includes(searchValue.toLowerCase())
    );
    setFilteredWorkouts(filtered);
    setPage(1);
  }, [searchValue, workouts]);

  useEffect(() => {
    setDisplayedWorkouts(filteredWorkouts.slice(0, page * ITEMS_PER_PAGE));
  }, [filteredWorkouts, page]);

  const loadMore = () => {
    if (displayedWorkouts.length < filteredWorkouts.length) {
      setPage(prevPage => prevPage + 1);
    }
  };

  return (
    <View style={styles.container}>
      <WorkoutDisplayHeader 
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />
      <WorkoutList 
        workouts={displayedWorkouts} 
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
      />
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