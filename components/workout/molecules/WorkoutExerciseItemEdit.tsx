// components/workout/molecules/WorkoutExerciseItemEdit.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutExercise, WorkoutSet } from '@/types/workout';
import WorkoutSetEditor from '../atoms/WorkoutSetEditor';

interface WorkoutExerciseItemEditProps {
  exercise: WorkoutExercise;
  isLastExercise: boolean;
  onExerciseChange: (exercise: WorkoutExercise) => void;
  onDeleteExercise: () => void;
}

const WorkoutExerciseItemEdit: React.FC<WorkoutExerciseItemEditProps> = ({
  exercise,
  isLastExercise,
  onExerciseChange,
  onDeleteExercise,
}) => {
  const [nameError, setNameError] = useState<string | null>(null);

  const handleNameChange = (name: string) => {
    if (name.trim().length === 0) {
      setNameError('Exercise name is required');
    } else {
      setNameError(null);
    }
    
    onExerciseChange({
      ...exercise,
      name
    });
  };

  const handleSetChange = (updatedSet: WorkoutSet, index: number) => {
    const newSets = [...exercise.workout_exercise_sets];
    newSets[index] = updatedSet;
    
    onExerciseChange({
      ...exercise,
      workout_exercise_sets: newSets
    });
  };

  const addSet = () => {
    const lastSet = exercise.workout_exercise_sets[exercise.workout_exercise_sets.length - 1];
    const newSet: WorkoutSet = {
      ...lastSet,
      id: `temp-${Date.now()}`, // Will be replaced on save
      set_number: lastSet.set_number + 1,
    };
    
    onExerciseChange({
      ...exercise,
      workout_exercise_sets: [...exercise.workout_exercise_sets, newSet]
    });
  };

  const deleteSet = (index: number) => {
    if (exercise.workout_exercise_sets.length === 1) {
      return; // Don't allow deleting the last set
    }
    
    const newSets = exercise.workout_exercise_sets.filter((_, i) => i !== index);
    // Reorder set numbers
    newSets.forEach((set, i) => {
      set.set_number = i + 1;
    });
    
    onExerciseChange({
      ...exercise,
      workout_exercise_sets: newSets
    });
  };

  return (
    <View style={[styles.container, !isLastExercise && styles.bottomBorder]}>
      <View style={styles.header}>
        <View style={styles.nameContainer}>
          <TextInput
            style={[
              styles.exerciseName,
              nameError && styles.inputError
            ]}
            value={exercise.name}
            onChangeText={handleNameChange}
            placeholder="Exercise Name"
            placeholderTextColor="#666"
          />
          {nameError && (
            <Text style={styles.errorText}>{nameError}</Text>
          )}
        </View>
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={onDeleteExercise}
        >
          <Ionicons name="trash-outline" size={20} color="#ff4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.setsContainer}>
        {exercise.workout_exercise_sets
          .sort((a, b) => a.set_number - b.set_number)
          .map((set, index) => (
// Update the setRow JSX in WorkoutExerciseItemEdit.tsx:
<View key={set.id} style={styles.setRow}>
  <Text style={styles.setNumber}>{index + 1}</Text>
  <View style={styles.setEditorContainer}>
    <WorkoutSetEditor
      set={set}
      onSetChange={(updatedSet) => handleSetChange(updatedSet, index)}
      isLastSet={index === exercise.workout_exercise_sets.length - 1}
    />
  </View>
  <TouchableOpacity 
    style={[
      styles.deleteSetButton,
      exercise.workout_exercise_sets.length === 1 && styles.deleteSetButtonDisabled
    ]}
    onPress={() => deleteSet(index)}
    disabled={exercise.workout_exercise_sets.length === 1}
  >
    <Ionicons 
      name="trash-outline" 
      size={20} 
      color={exercise.workout_exercise_sets.length === 1 ? '#666' : '#ff4444'} 
    />
  </TouchableOpacity>
</View>
          ))}
      </View>

      <TouchableOpacity 
        style={styles.addSetButton} 
        onPress={addSet}
      >
        <Ionicons name="add-circle-outline" size={20} color="#8cd884" />
        <Text style={styles.addSetText}>Add Set</Text>
      </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#222',
  },
  nameContainer: {
    flex: 1,
  },
  exerciseName: {
    color: '#8cd884',
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: '#333',
    padding: 8,
    borderRadius: 4,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 12,
  },
  setsContainer: {
    padding: 12,
  },
  deleteSetButtonDisabled: {
    opacity: 0.5,
  },
  setEditorContainer: {
    flex: 1,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  setNumber: {
    color: '#888',
    fontSize: 14,
    width: 24,
    textAlign: 'center',
  },
  deleteSetButton: {
    padding: 8,
    marginLeft: 4,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#222',
  },
  addSetText: {
    color: '#8cd884',
    fontSize: 14,
    marginLeft: 8,
  },
});

export default WorkoutExerciseItemEdit;