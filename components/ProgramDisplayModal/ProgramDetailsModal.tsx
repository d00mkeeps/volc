import React, { useState } from 'react';
import { Modal, View, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { ProgramDisplaySlide } from './slides/ProgramDisplaySlide';
import { Program, Workout, ProgramDetailsModalProps } from '@/types';
import { Header } from './atoms/MainHeader';

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
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Header title={program.name} onClose={onClose} />
              <View style={styles.contentContainer}>
                <ProgramDisplaySlide
                  program={program}
                  selectedWorkout={selectedWorkout}
                  onWorkoutChange={handleWorkoutChange}
                />
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };
  
  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    centeredView: {
      flex: 1,
      alignItems: 'center',
    },
    modalView: {
      backgroundColor: '#559e55',
      borderRadius: 20,
      alignItems: 'stretch',
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
      overflow: 'hidden', // This ensures child components don't overflow rounded corners
    },
    contentContainer: {
      flex: 1,
      backgroundColor: '#559e55', // Match this with modalView background color
    },
  });