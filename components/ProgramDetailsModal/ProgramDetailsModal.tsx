import React, { useState } from 'react';
import { Modal, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Button } from '@/components/public/atoms';
import { Program } from '@/types';

interface ProgramDetailsModalProps {
  isVisible: boolean;
  onClose: () => void;
  program: Program | null;
}

export const ProgramDetailsModal: React.FC<ProgramDetailsModalProps> = ({ isVisible, onClose, program }) => {
  const [activeTab, setActiveTab] = useState<'workouts' | 'notes'>('workouts');

  if (!program) return null;

  const toggleTab = () => {
    setActiveTab(activeTab === 'workouts' ? 'notes' : 'workouts');
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.headerText}>{program.name}</Text>
          <ScrollView style={styles.contentContainer}>
            <View style={styles.tabContent}>
              {activeTab === 'workouts' ? (
                <Text style={styles.contentText}>
                  {program.workouts.map(workout => (
                    <Text key={workout.id}>{workout.name}{'\n'}</Text>
                  ))}
                </Text>
              ) : (
                <Text style={styles.contentText}>Program notes will be displayed here.</Text>
              )}
            </View>
          </ScrollView>
          <View style={styles.footer}>
            <Button onPress={onClose} style={styles.closeButton}>
              Close
            </Button>
            <Button onPress={toggleTab} style={styles.navButton}>
              {activeTab === 'workouts' ? 'View Notes' : 'Back to Workouts'}
            </Button>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#1f281f',
    borderRadius: 20,
    width: '90%',
    height: '80%',
    overflow: 'hidden',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ddd',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#559e55',
  },
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  contentText: {
    color: '#ddd',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#559e55',
  },
  closeButton: {
    paddingHorizontal: 20,
  },
  navButton: {
    paddingHorizontal: 20,
  },
});