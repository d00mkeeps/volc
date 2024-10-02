import React, { useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { ProgramDisplaySlide } from './slides/ProgramDisplaySlide';
import { Program, Workout, ProgramDetailsModalProps } from '@/types';

export const ProgramDetailsModal: React.FC<ProgramDetailsModalProps> = ({ program, isVisible, onClose }) => {
    const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(program.workouts[0] || null);
  
    const handleWorkoutChange = (workout: Workout | null) => {
      setSelectedWorkout(workout);
    };
  
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={isVisible}
        onRequestClose={onClose}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
            <ProgramDisplaySlide
              program={program}
              selectedWorkout={selectedWorkout}
              onWorkoutChange={handleWorkoutChange}
            />
          </View>
        </View>
      </Modal>
    );
  };
  
  const styles = StyleSheet.create({
    centeredView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
      backgroundColor: '#559e55',
      borderRadius: 20,
      padding: 20,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      width: '90%',
      height: '90%',
    },
    closeButton: {
      alignSelf: 'flex-end',
      padding: 10,
    },
    closeButtonText: {
      color: '#ddd',
      fontWeight: 'bold',
    },
  });