// components/workout/organisms/WorkoutDetailModal.tsx
import React, { useState } from 'react';
import { Modal, View, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CompleteWorkout } from '@/types/workout';
import WorkoutModalHeader from '../molecules/WorkoutModalHeader';
import WorkoutNotesList from '../molecules/WorkoutNotesList';
import WorkoutExerciseList from './WorkoutExerciseList';
import { useWorkout } from '@/context/WorkoutContext';

interface WorkoutDetailModalProps {
  isVisible: boolean;
  workout: CompleteWorkout;
  onClose: () => void;
  onSave?: (workout: CompleteWorkout) => Promise<void>;
}

const WorkoutDetailModal: React.FC<WorkoutDetailModalProps> = ({
  isVisible,
  workout,
  onClose,
  onSave,
}) => {
  const {deleteWorkout, setWorkouts} = useWorkout()
  const handleDelete = () => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWorkout(workout.id);
              // Close modal first
              onClose();
              // Then update the workouts state in context
              setWorkouts(prev => prev.filter(w => w.id !== workout.id));
            } catch (error) {
              Alert.alert(
                'Error',
                'Failed to delete workout',
                [{ text: 'OK' }]
              );
            }
          }
        }
      ]
    );
  };
  
  const [editMode, setEditMode] = useState(false);
  const [editedWorkout, setEditedWorkout] = useState<CompleteWorkout>(workout);
  const [isSaving, setIsSaving] = useState(false);

  const validateWorkout = (workout: CompleteWorkout): string[] => {
    const errors: string[] = [];

    // Validate workout name
    if (!workout.name?.trim()) {
      errors.push('Workout name is required');
    }

    // Validate exercises
    if (!workout.workout_exercises?.length) {
      errors.push('At least one exercise is required');
    } else {
      workout.workout_exercises.forEach((exercise, index) => {
        if (!exercise.name?.trim()) {
          errors.push(`Exercise ${index + 1} requires a name`);
        }
        if (!exercise.workout_exercise_sets?.length) {
          errors.push(`Exercise ${exercise.name || index + 1} requires at least one set`);
        }
      });
    }

    return errors;
  };

  const handleClose = () => {
    if (editMode) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              setEditMode(false);
              setEditedWorkout(workout);
              onClose();
            },
          },
        ],
      );
    } else {
      onClose();
    }
  };

  const handleSave = async () => {
    const errors = validateWorkout(editedWorkout);
    if (errors.length > 0) {
      Alert.alert(
        'Validation Error',
        errors.join('\n'),
        [{ text: 'OK' }]
      );
      return;
    }

    if (onSave) {
      try {
        setIsSaving(true);
        await onSave(editedWorkout);
        setEditMode(false);
        onClose();
      } catch (error) {
        Alert.alert(
          'Error',
          'Failed to save workout changes',
          [{ text: 'OK' }]
        );
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.headerButton} 
              onPress={handleClose}
              disabled={isSaving}
            >
              <Ionicons name="close" size={24} color={isSaving ? '#666' : '#fff'} />
            </TouchableOpacity>
            {editMode ? (
              <View style={styles.editButtons}>
                <TouchableOpacity 
                  style={[styles.headerButton, styles.saveButton]} 
                  onPress={handleSave}
                  disabled={isSaving}
                >
                  <Ionicons 
                    name={isSaving ? "hourglass-outline" : "checkmark"} 
                    size={24} 
                    color={isSaving ? '#666' : '#8cd884'} 
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.headerButton} 
                  onPress={() => {
                    setEditedWorkout(workout);
                    setEditMode(false);
                  }}
                  disabled={isSaving}
                >
                  <Ionicons 
                    name="close-circle" 
                    size={24} 
                    color={isSaving ? '#666' : '#ff4444'} 
                  />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.headerButton} 
                onPress={() => setEditMode(true)}
              >
                <Ionicons name="pencil" size={24} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            <WorkoutModalHeader 
              workout={editMode ? editedWorkout : workout}
              editMode={editMode}
              onWorkoutChange={setEditedWorkout}
              onDeletePress={handleDelete}
            />
            {workout.notes !== undefined && (
              <WorkoutNotesList 
                notes={editMode ? editedWorkout.notes || '' : workout.notes || ''}
                editMode={editMode}
                onNotesChange={(notes) => 
                  setEditedWorkout(prev => ({ ...prev, notes }))
                }
              />
            )}
            <WorkoutExerciseList 
              exercises={editMode ? editedWorkout.workout_exercises : workout.workout_exercises}
              editMode={editMode}
              onExercisesChange={(exercises) => 
                setEditedWorkout(prev => ({ ...prev, workout_exercises: exercises }))
              }
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#222',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: '80%',
    maxHeight: '90%',
    padding: 20,
    position: 'relative',
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  editButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
  },
  saveButton: {
    marginRight: 8,
  },
});

export default WorkoutDetailModal;