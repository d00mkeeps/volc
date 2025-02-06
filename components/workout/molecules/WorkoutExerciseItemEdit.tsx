import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutExercise, WorkoutField, WorkoutSet } from '@/types/workout';
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
  const [visibleFields, setVisibleFields] = useState<Set<WorkoutField>>(() => {
    const fields = new Set<WorkoutField>();
    exercise.workout_exercise_sets.forEach(set => {
      if (set.weight !== null) fields.add('weight');
      if (set.reps !== null) fields.add('reps');
      if (set.rpe !== null) fields.add('rpe');
      if (set.distance !== null) fields.add('distance');
      if (set.duration !== null) fields.add('duration');
    });
    if (fields.size === 0) fields.add('reps');
    return fields;
  });
  const [showFieldMenu, setShowFieldMenu] = useState(false);

  const availableFields: Array<{id: WorkoutField, label: string}> = [
    { id: 'weight' as WorkoutField, label: 'Weight measurement' },
    { id: 'distance' as WorkoutField, label: 'Distance' },
    { id: 'duration' as WorkoutField, label: 'Duration' },
    { id: 'rpe' as WorkoutField, label: 'RPE' }
  ].filter(field => !visibleFields.has(field.id));

  const addField = (fieldId: WorkoutField) => {
    setVisibleFields(prev => new Set([...prev, fieldId]));
    const updatedSets = exercise.workout_exercise_sets.map(set => ({
      ...set,
      [fieldId]: null
    }));
    onExerciseChange({
      ...exercise,
      workout_exercise_sets: updatedSets
    });
    setShowFieldMenu(false);
  };

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
            style={[styles.exerciseName, nameError && styles.inputError]}
            value={exercise.name}
            onChangeText={handleNameChange}
            placeholder="Exercise Name"
            placeholderTextColor="#666"
          />
          {nameError && <Text style={styles.errorText}>{nameError}</Text>}
        </View>
        <View style={styles.headerButtons}>
          {availableFields.length > 0 && (
            <TouchableOpacity 
              style={styles.addFieldButton} 
              onPress={() => setShowFieldMenu(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color="#8cd884" />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={onDeleteExercise}
          >
            <Ionicons name="trash-outline" size={20} color="#ff4444" />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showFieldMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFieldMenu(false)}
      >
        <TouchableOpacity 
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowFieldMenu(false)}
        >
          <View style={styles.menuContent}>
            {availableFields.map(field => (
              <TouchableOpacity
                key={field.id}
                style={styles.menuItem}
                onPress={() => addField(field.id)}
              >
                <Text style={styles.menuItemText}>{field.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.setsContainer}>
        {exercise.workout_exercise_sets
          .sort((a, b) => a.set_number - b.set_number)
          .map((set, index) => (
            <View key={set.id} style={styles.setRow}>
              <Text style={styles.setNumber}>{index + 1}</Text>
              <View style={styles.setEditorContainer}>
                <WorkoutSetEditor
                  set={set}
                  visibleFields={Array.from(visibleFields)}
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addFieldButton: {
    padding: 8,
    marginRight: 8,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 16,
    minWidth: 200,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  menuItemText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default WorkoutExerciseItemEdit;