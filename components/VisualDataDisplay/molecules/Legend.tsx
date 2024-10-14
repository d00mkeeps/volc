// Legend.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useVisualData } from '../context/VisualDataContext';

export const Legend: React.FC = () => {
  const { selectedExercises } = useVisualData();

  const getColor = (index: number) => {
    const colors = ['white', 'green', 'blue'];
    return colors[index % colors.length];
  };

  return (
    <View style={styles.container}>
      {selectedExercises.map((exercise, index) => (
        <View key={exercise} style={styles.legendItem}>
          <View style={[styles.colorBox, { backgroundColor: getColor(index) }]} />
          <Text style={styles.legendText}>{exercise}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#559e55',
    borderRadius: 10,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  colorBox: {
    width: 15,
    height: 15,
    marginRight: 5,
  },
  legendText: {
    color: '#ddd',
    fontSize: 12,
  },
});