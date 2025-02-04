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
  const getHeaderItems = () => {
    const items = ['Set'];
    if (exercise.workout_exercise_sets.some(set => set.weight !== null)) {
      items.push(`Weight (${exercise.weight_unit || 'kg'})`);
    }
    if (exercise.workout_exercise_sets.some(set => set.reps !== null)) {
      items.push('Reps');
    }
    if (exercise.workout_exercise_sets.some(set => set.rpe !== null)) {
      items.push('RPE');
    }
    if (exercise.workout_exercise_sets.some(set => set.distance !== null)) {
      items.push(`Distance (${exercise.distance_unit || 'm'})`);
    }
    if (exercise.workout_exercise_sets.some(set => set.duration !== null)) {
      items.push('Time');
    }
    return items;
  };

  return (
    <View style={[styles.container, !isLastExercise && styles.bottomBorder]}>
      <Text style={styles.exerciseName}>{exercise.name}</Text>
      
      <View style={styles.headerRow}>
        {getHeaderItems().map((item, index) => (
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