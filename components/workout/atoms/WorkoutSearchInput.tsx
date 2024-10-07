import React from 'react';
import { TextInput, StyleSheet } from 'react-native';

interface WorkoutSearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

const WorkoutSearchInput: React.FC<WorkoutSearchInputProps> = ({ value, onChangeText }) => (
  <TextInput
    style={styles.input}
    value={value}
    onChangeText={onChangeText}
    placeholder="Search workouts"
    placeholderTextColor="#888"
  />
);

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#333',
    color: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    flex: 1,
    marginRight: 8,
  },
});

export default WorkoutSearchInput;