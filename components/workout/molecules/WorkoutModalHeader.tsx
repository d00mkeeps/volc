// components/workout/molecules/WorkoutModalHeader.tsx
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { CompleteWorkout } from '@/types/workout';

interface WorkoutModalHeaderProps {
  workout: CompleteWorkout;
  editMode: boolean;
  onWorkoutChange: React.Dispatch<React.SetStateAction<CompleteWorkout>>;
}

const WorkoutModalHeader: React.FC<WorkoutModalHeaderProps> = ({ 
  workout,
  editMode,
  onWorkoutChange 
}) => {
  const formattedDate = new Date(workout.created_at).toLocaleDateString();

  const handleNameChange = (name: string) => {
    onWorkoutChange(prev => ({
      ...prev,
      name
    }));
  };

  return (
    <View style={styles.container}>
      {editMode ? (
        <TextInput
          style={[styles.title, styles.input]}
          value={workout.name}
          onChangeText={handleNameChange}
          placeholder="Workout Name"
          placeholderTextColor="#666"
        />
      ) : (
        <Text style={styles.title}>{workout.name}</Text>
      )}
      <Text style={styles.date}>{formattedDate}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  title: {
    color: '#8cd884',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#333',
    padding: 8,
    borderRadius: 4,
  },
  date: {
    color: '#888',
    fontSize: 14,
  },
});

export default WorkoutModalHeader;