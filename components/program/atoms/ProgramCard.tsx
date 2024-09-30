// components/ProgramCard.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Dimensions } from 'react-native';
import { ProgramCardProps } from '@/types';

const windowWidth = Dimensions.get('window').width;
const cardSize = (windowWidth - 48) / 2; // 48 = 16 * 3 (left padding + right padding + space between cards)

const ProgramCard: React.FC<ProgramCardProps> = ({ program, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress && onPress(program.id)}>
      <Text style={styles.title}>{program.name}</Text>
      <Text style={styles.description} numberOfLines={3} ellipsizeMode="tail">
        {program.description}
      </Text>
      <Text style={styles.createdAt}>
        Created: {new Date(program.createdAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: cardSize,
    height: cardSize,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#559e55',
    margin: 8,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ddd',
    marginBottom: 8,
  },
  description: {
    fontSize: 12,
    color: '#eee',
    flex: 1,
  },
  createdAt: {
    fontSize: 10,
    color: '#222',
    marginTop: 8,
  },
});

export default ProgramCard;