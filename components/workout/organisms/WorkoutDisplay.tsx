import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import WorkoutDisplayHeader from '../molecules/WorkoutDisplayHeader';
import WorkoutList from '../molecules/WorkoutList';
import { CompleteWorkout } from '@/types/workout';

interface WorkoutDisplayProps {
  workouts: CompleteWorkout[];
}

const ITEMS_PER_PAGE = 20;

const WorkoutDisplay: React.FC<WorkoutDisplayProps> = ({ workouts }) =>{
  const [value, setValue] = useState('');
  const [filteredWorkouts, setFilteredWorkouts] = useState(workouts);
  const [displayedWorkouts, setDisplayedWorkouts] = useState<CompleteWorkout[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const filtered = workouts.filter(workout => {
      const nameMatch = workout.name.toLowerCase().includes(value.toLowerCase());
      
      if (!workout.notes) return nameMatch;

      try {
        if (workout.notes.startsWith('[') && workout.notes.endsWith(']')) {
          // Parse JSON array and search through all notes
          const parsedNotes = JSON.parse(workout.notes) as string[];
          return nameMatch || parsedNotes.some(note => 
            note.toLowerCase().includes(value.toLowerCase())
          );
        }
      } catch {
        // If JSON parsing fails, search original string
      }
      
      // Default to searching the original string
      return nameMatch || workout.notes.toLowerCase().includes(value.toLowerCase());
    });

    setFilteredWorkouts(filtered);
    setPage(1);
  }, [value, workouts]);

  useEffect(() => {
    setDisplayedWorkouts(filteredWorkouts.slice(0, page * ITEMS_PER_PAGE));
  }, [filteredWorkouts, page]);

  const loadMore = () => {
    if (displayedWorkouts.length < filteredWorkouts.length) {
      setPage(prevPage => prevPage + 1);
    }
  };

  if (workouts.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.emptyText}>No workouts found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WorkoutDisplayHeader 
        value={value}
        onSearchChange={setValue}
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#222',
    fontSize: 16,
  },
});

export default WorkoutDisplay;