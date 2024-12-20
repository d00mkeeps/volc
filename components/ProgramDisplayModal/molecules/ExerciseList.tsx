import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { ExerciseCard } from '../atoms/ExerciseCard';
import { ExerciseListProps } from '@/types'; 

export const ExerciseList: React.FC<ExerciseListProps> = ({ workout }) => {
  return (
    <View style={styles.container}>
      <FlatList
        data={workout.exercises}
        renderItem={({ item }) => <ExerciseCard exercise={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});