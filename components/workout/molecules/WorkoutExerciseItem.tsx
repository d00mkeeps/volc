import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WorkoutExercise } from '@/types/workout';
import WorkoutSetItem from '../atoms/WorkoutSetItem';

interface WorkoutExerciseItemProps {
  exercise: WorkoutExercise;
  isLastExercise: boolean;
}

const WorkoutExerciseItem: React.FC<WorkoutExerciseItemProps> = ({
  exercise,
  isLastExercise,
}) => {
  const getHeaderConfig = () => {
    const config = {
      weight: exercise.workout_exercise_sets.some(set => set.weight !== null),
      reps: exercise.workout_exercise_sets.some(set => set.reps !== null),
      rpe: exercise.workout_exercise_sets.some(set => set.rpe !== null),
      distance: exercise.workout_exercise_sets.some(set => set.distance !== null),
      duration: exercise.workout_exercise_sets.some(set => set.duration !== null),
    };
    return config;
  };

  const headerConfig = getHeaderConfig();
  const headerItems = ['Set'];
  if (headerConfig.weight) headerItems.push(`Weight (${exercise.weight_unit || 'kg'})`);
  if (headerConfig.reps) headerItems.push('Reps');
  if (headerConfig.rpe) headerItems.push('RPE');
  if (headerConfig.distance) headerItems.push(`Distance (${exercise.distance_unit || 'm'})`);
  if (headerConfig.duration) headerItems.push('Time');

  return (
    <View style={[styles.container, !isLastExercise && styles.bottomBorder]}>
      <Text style={styles.exerciseName}>{exercise.name}</Text>
      <View style={styles.headerRow}>
        {headerItems.map((item, index) => (
          <Text key={index} style={styles.headerText}>{item}</Text>
        ))}
      </View>
      {exercise.workout_exercise_sets
        .sort((a, b) => a.set_number - b.set_number)
        .map((set, index) => (
          <WorkoutSetItem
            key={set.id}
            set={set}
            isLastSet={index === exercise.workout_exercise_sets.length - 1}
            activeFields={headerConfig}
          />
        ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    overflow: 'hidden',
  },
  bottomBorder: {
    marginBottom: 20,
  },
  exerciseName: {
    color: '#8cd884',
    fontSize: 18,
    fontWeight: 'bold',
    padding: 12,
    backgroundColor: '#222',
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#222',
  },
  headerText: {
    color: '#888',
    fontSize: 14,
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default WorkoutExerciseItem;