import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Button } from '@/components/public/atoms';
import { ProgramCreationModal } from '@/components/ProgramCreationModal'; // Import the new modal

export default function ProgramsScreen() {
  const [isProgramModalVisible, setIsProgramModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Programs</Text>
      <Button onPress={() => setIsProgramModalVisible(true)}>
        Create New Program
      </Button>
      <ProgramCreationModal 
        isVisible={isProgramModalVisible} 
        onClose={() => setIsProgramModalVisible(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});