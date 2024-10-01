import React, { useState } from 'react';
import { StyleSheet, View as RNView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Button } from '@/components/public/atoms';
import { ProgramCreationModal } from '@/components/ProgramCreationModal';
import { ProgramDetailsModal } from '@/components/ProgramDetailsModal/ProgramDetailsModal';
import ProgramList from '@/components/program/molecules/ProgramList';
import { mockPrograms } from '@/assets/mockData';
import { Program } from '@/types';

export default function ProgramsScreen() {
  const [isProgramModalVisible, setIsProgramModalVisible] = useState(false);
  const [isProgramDetailsModalVisible, setIsProgramDetailsModalVisible] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null >(null);

  const handleProgramPress = (programId: string) => {
    const program = mockPrograms.find(p => p.id === programId);
    if (program) {
      setSelectedProgram(program);
      setIsProgramDetailsModalVisible(true);
    }
  };

  return (
    <View style={styles.container}>
      <RNView style={styles.header}>
        <Text style={styles.title}>Programs</Text>
        <Button 
          onPress={() => setIsProgramModalVisible(true)}
          style={styles.createButton}
        >
          Create New Program
        </Button>
      </RNView>
      <ProgramList 
        programs={mockPrograms} 
        onProgramPress={handleProgramPress}
      />
      <ProgramCreationModal 
        isVisible={isProgramModalVisible} 
        onClose={() => setIsProgramModalVisible(false)} 
      />
      <ProgramDetailsModal
        isVisible={isProgramDetailsModalVisible}
        onClose={() => setIsProgramDetailsModalVisible(false)}
        program={selectedProgram}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  createButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});