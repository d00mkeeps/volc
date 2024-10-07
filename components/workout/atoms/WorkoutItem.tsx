import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Workout } from '@/types';

interface WorkoutItemProps {
  workout: Workout;
  isLastItem?: boolean;
}

const WorkoutItem: React.FC<WorkoutItemProps> = ({ workout, isLastItem = false }) => {
  const formattedDate = new Date(workout.createdAt).toLocaleDateString();
  const truncatedDescription = workout.description.length > 50 
    ? workout.description.substring(0, 47) + '...' 
    : workout.description;

  return (
    <View style={[styles.container, isLastItem && styles.lastItem]}>
      <View style={styles.contentContainer}>
        <Text style={styles.name}>{workout.name}</Text>
        <Text style={styles.description}>{truncatedDescription}</Text>
      </View>
      <Text style={styles.date}>{formattedDate}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#666',
  },
  contentContainer: {
    flex: 1,
    marginRight: 16,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  name: {
    color: '#8cd884',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    color: '#bbb',
    fontSize: 14,
  },
  date: {
    color: '#eee',
    fontSize: 12,
  },
});

export default WorkoutItem;