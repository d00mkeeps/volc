// components/ProgramList.tsx
import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ProgramListProps } from '@/types';
import ProgramCard from '../atoms/ProgramCard';

const ProgramList: React.FC<ProgramListProps> = ({ programs, onProgramPress }) => {
  return (
    <FlatList
      data={programs}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ProgramCard program={item} onPress={onProgramPress} />
      )}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.listContainer}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 8,
  },
  row: {
    justifyContent: 'space-between',
  },
});

export default ProgramList;