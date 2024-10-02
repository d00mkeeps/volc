import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ProgramCardProps } from '@/types';

const ProgramCard: React.FC<ProgramCardProps> = ({ program, onPress }) => {
  const handlePress = () => {
    if (onPress) {
      onPress(program.id);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={handlePress}
    >
      <Text style={styles.title}>{program.name}</Text>
      <Text style={styles.description}>{program.description}</Text>
    </TouchableOpacity>
  );
};


const styles = StyleSheet.create({
  card: {
    backgroundColor: '#559e55',
    borderRadius: 10,
    padding: 16,
    margin: 8,
    width: '47%', // Adjust based on your layout preferences
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#ddd',
  },
});

export default ProgramCard;