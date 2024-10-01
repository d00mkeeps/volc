import React, { useState } from 'react';
import { View, Text, Modal, Pressable, FlatList, StyleSheet } from 'react-native';
import { WorkoutSelectProps } from '@/types';

const WorkoutSelect: React.FC<WorkoutSelectProps> = ({ workouts, selectedWorkout, onSelectWorkout }) => {
    const [modalVisible, setModalVisible] = useState(false);
  
    const openModal = () => setModalVisible(true);
    const closeModal = () => setModalVisible(false);
  
    const handleSelectWorkout = (workout: string) => {
      onSelectWorkout(workout);
      closeModal();
    };
  
    return (
      <View>
        <Pressable onPress={openModal} style={styles.selectButton}>
          <Text>{selectedWorkout || 'Select a workout'}</Text>
        </Pressable>
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <FlatList
                data={workouts}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.optionItem}
                    onPress={() => handleSelectWorkout(item)}
                  >
                    <Text>{item}</Text>
                  </Pressable>
                )}
              />
              <Pressable onPress={closeModal} style={styles.closeButton}>
                <Text>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  const styles = StyleSheet.create({
    selectButton: {
      padding: 10,
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 5,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: 'white',
      padding: 20,
      borderRadius: 10,
      width: '80%',
    },
    optionItem: {
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#ccc',
    },
    closeButton: {
      marginTop: 20,
      padding: 10,
      backgroundColor: '#f0f0f0',
      borderRadius: 5,
      alignItems: 'center',
    },
  });
