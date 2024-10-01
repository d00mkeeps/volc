import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/Themed';
import { ProgramNoteSlideProps } from '@/types';

export const ProgramNotesSlide: React.FC<ProgramNoteSlideProps> = ({ program }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Program Notes</Text>
    <Text style={styles.content}>Notes for {program.name} will be displayed here.</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ddd',
    marginBottom: 20,
  },
  content: {
    fontSize: 16,
    color: '#bbb',
  },
});