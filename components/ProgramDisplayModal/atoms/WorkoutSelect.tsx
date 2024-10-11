import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, TextInput, StyleSheet } from 'react-native';
import { WorkoutSelectProps } from '@/types'; 

export const WorkoutSelect: React.FC<WorkoutSelectProps> = ({ workouts, selectedWorkout, onSelectWorkout }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredWorkouts = workouts.filter(workout =>
    workout.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (workout: string) => {
    onSelectWorkout(workout);
    setModalVisible(false);
  };

  return (
    <View>
        <TouchableOpacity style={styles.selectButton} onPress={() => setModalVisible(true)}>
        <View style={styles.selectButtonContainer}>
          <Text style={styles.selectButtonText}>
            {selectedWorkout || 'Select a workout'}
          </Text>
          <Text style={styles.listIcon}>☰</Text>
        </View>
      </TouchableOpacity>
      
      <Modal
        animationType="none"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <TextInput
              style={styles.searchInput}
              onChangeText={setSearchQuery}
              value={searchQuery}
              placeholder="Search workouts..."
              placeholderTextColor="#1f281f"
            />
            <FlatList
              data={filteredWorkouts}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.workoutItem} onPress={() => handleSelect(item)}>
                  <Text style={styles.workoutItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  selectButton: {
    padding: 10,
    backgroundColor: '#4a854a',
    borderRadius: 10,
  },
  selectButtonText: {
    color: '#ddd',
    fontSize: 24,  
    fontWeight: 'bold',
    textAlign: 'center',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: '#559e55',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
    maxHeight: '80%',
  },
  searchInput: {
    height: 40,
    borderColor: '#4a854a',
    borderWidth: 1,
    borderRadius: 10,
    paddingLeft: 10,
    marginBottom: 10,
    width: '100%',
    color: '#eee',
    backgroundColor: '#4a854a',
  },
  workoutItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#4a854a',
    width: '100%',
  },
  workoutItemText: {
    color: '#ddd',
    fontSize: 16,
  },
  closeButton: {
    marginTop: 15,
    backgroundColor: '#4a854a',
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  closeButtonText: {
    color: '#ddd',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  caret: {
    fontSize: 18, 
    color: '#ddd',
  },
  selectButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listIcon: {
    color: '#eee',
    fontSize: 24,
    marginLeft: 5, 
    paddingRight: 8,

  },


});