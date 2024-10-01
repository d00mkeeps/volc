// ProgramDetailSlide.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { WorkoutDisplay } from '../organisms/WorkoutDisplay';
import { ProgramDetailSlideProps } from '@/types';

export const ProgramDetailSlide: React.FC<ProgramDetailSlideProps> = ({ 
  program, 
  selectedWorkout, 
  onWorkoutChange 
}) => (
  <View style={styles.container}>
    <Picker
      selectedValue={selectedWorkout?.id || ''}
      style={styles.picker}
      onValueChange={(itemValue) => {
        const workout = program.workouts.find(w => w.id === itemValue);
        onWorkoutChange(workout || null);
      }}
    >
      <Picker.Item label="Select a workout" value="" />
      {program.workouts.map((workout) => (
        <Picker.Item key={workout.id} label={workout.name} value={workout.id} />
      ))}
    </Picker>
    {selectedWorkout && <WorkoutDisplay workout={selectedWorkout} />}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#ddd',
    backgroundColor: '#2f3f2f',
  },
});