import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import WorkoutItem from '../atoms/WorkoutItem';
import { Workout } from '@/types';

interface WorkoutListProps {
  workouts: Workout[];
}

const WorkoutList: React.FC<WorkoutListProps> = ({ workouts }) => (
  <FlatList
    data={workouts}
    renderItem={({ item, index }) => (
      <WorkoutItem 
        workout={item} 
        isLastItem={index === workouts.length - 1}
      />
    )}
    keyExtractor={(item) => item.id}
    style={styles.container}
  />
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111',
  },
});

export default WorkoutList;