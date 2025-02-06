import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutExercise } from '@/types/workout';
import WorkoutExerciseItem from '../molecules/WorkoutExerciseItem';
import WorkoutExerciseItemEdit from '../molecules/WorkoutExerciseItemEdit';

interface WorkoutExerciseListProps {
  exercises: WorkoutExercise[];
  editMode: boolean;
  onExercisesChange: (exercises: WorkoutExercise[]) => void;
}

const WorkoutExerciseList: React.FC<WorkoutExerciseListProps> = ({
  exercises,
  editMode,
  onExercisesChange,
}) => {
  const sortedExercises = [...exercises].sort((a, b) => a.order_index - b.order_index);

  const handleExerciseChange = (updatedExercise: WorkoutExercise, index: number) => {
    const newExercises = [...exercises];
    newExercises[index] = updatedExercise;
    onExercisesChange(newExercises);
  };

  const handleDeleteExercise = (index: number) => {
    if (exercises.length === 1) {
      return; // Don't allow deleting the last exercise
    }

    const newExercises = exercises.filter((_, i) => i !== index);
    // Reorder exercise indices
    newExercises.forEach((exercise, i) => {
      exercise.order_index = i;
    });
    onExercisesChange(newExercises);
  };

  const addExercise = () => {
    const now = new Date().toISOString();
    const newExercise: WorkoutExercise = {
      id: `temp-${Date.now()}`, // Will be replaced on save
      workout_id: exercises[0].workout_id,
      name: '',
      order_index: exercises.length,
      weight_unit: 'kg',
      distance_unit: 'm',
      created_at: now,
      updated_at: now,
      workout_exercise_sets: [
        {
          id: `temp-set-${Date.now()}`,
          exercise_id: `temp-${Date.now()}`,
          set_number: 1,
          weight: null,
          reps: null,
          rpe: null,
          distance: null,
          duration: null,
          created_at: now,
          updated_at: now
        }
      ]
    };
  
    onExercisesChange([...exercises, newExercise]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Exercises</Text>
      {sortedExercises.map((exercise, index) => (
        editMode ? (
          <WorkoutExerciseItemEdit
            key={exercise.id}
            exercise={exercise}
            isLastExercise={index === exercises.length - 1}
            onExerciseChange={(updatedExercise) => 
              handleExerciseChange(updatedExercise, index)
            }
            onDeleteExercise={() => handleDeleteExercise(index)}
          />
        ) : (
          <WorkoutExerciseItem
            key={exercise.id}
            exercise={exercise}
            isLastExercise={index === exercises.length - 1}
          />
        )
      ))}
      
      {editMode && (
        <TouchableOpacity 
          style={styles.addExerciseButton} 
          onPress={addExercise}
        >
          <Ionicons name="add-circle-outline" size={20} color="#8cd884" />
          <Text style={styles.addExerciseText}>Add Exercise</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  addExerciseText: {
    color: '#8cd884',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default WorkoutExerciseList;