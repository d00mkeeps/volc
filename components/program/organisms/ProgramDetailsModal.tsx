import React, { useState } from 'react';
import { View, Modal, StyleSheet, SafeAreaView } from 'react-native';
import { Text } from '@/components/Themed';
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
          <View style={styles.header}>
            <Text style={styles.headerText}>{program.name}</Text>
          </View>
          <View style={styles.contentContainer}>
            {activeTab === 'workouts' ? (
              <View style={styles.tabContent}>
                <Text style={styles.contentText}>Workout details will be displayed here.</Text>
              </View>
            ) : (
              <View style={styles.tabContent}>
                <Text style={styles.contentText}>Program notes will be displayed here.</Text>
              </View>
            )}
          </View>
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
  header: {
    padding: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#8cd884',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8cd884',
  },
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
   
  },
  closeButton: {
    paddingHorizontal: 20,
  },
  navButton: {
    paddingHorizontal: 20,
  },
});