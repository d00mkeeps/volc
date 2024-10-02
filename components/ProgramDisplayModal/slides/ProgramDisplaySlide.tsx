import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Header } from '../atoms/MainHeader';
import { WorkoutDisplay } from '../organisms/WorkoutDisplay';
import { ProgramDetailSlideProps } from '@/types';

export const ProgramDisplaySlide: React.FC<ProgramDetailSlideProps> = ({ program, selectedWorkout, onWorkoutChange }) => {
  return (
    <View style={styles.container}>
      <WorkoutDisplay
        workout={selectedWorkout}
        workouts={program.workouts}
        onWorkoutChange={onWorkoutChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f281f',
  },
});