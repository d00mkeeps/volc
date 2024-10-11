import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Legend: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Legend</Text>
      <View style={styles.legendItem}>
        <View style={[styles.legendColor, { backgroundColor: '#ddd' }]} />
        <Text style={styles.legendText}>Weight</Text>
      </View>
      {/* Add more legend items as needed */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#4a854a',
    borderRadius: 10,
    marginTop: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ddd',
    marginBottom: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  legendColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 10,
  },
  legendText: {
    fontSize: 14,
    color: '#ddd',
  },
});

export default Legend;