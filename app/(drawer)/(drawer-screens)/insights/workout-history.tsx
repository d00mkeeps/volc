import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import WorkoutDisplay from '@/components/workout/organisms/WorkoutDisplay';
import { useWorkout } from '@/context/WorkoutContext';
import { useAuth } from '@/context/AuthContext';
import Toast from 'react-native-toast-message';

export default function WorkoutHistoryScreen() {
  const { workouts, loading, error, loadWorkouts, clearError } = useWorkout();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      loadWorkouts(user.id);
    }
  }, [user?.id, loadWorkouts]);

  useEffect(() => {
    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message,
      });
      clearError();
    }
  }, [error, clearError]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#8cd884" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WorkoutDisplay workouts={workouts} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});