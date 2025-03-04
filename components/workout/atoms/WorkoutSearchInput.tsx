import React from 'react';
import { TextInput, StyleSheet, View, Platform } from 'react-native';

interface WorkoutSearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

const WorkoutSearchInput: React.FC<WorkoutSearchInputProps> = ({ value, onChangeText }) => {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder="Search workouts"
        placeholderTextColor="#aaa"
        selectionColor="#8cd884"
        cursorColor="#8cd884"
        autoCorrect={false}
        autoCapitalize="none"
        {...Platform.select({
          ios: {
            clearButtonMode: 'while-editing'
          },
          android: {
            textAlignVertical: 'center'
          }
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    paddingVertical: 8
  },
  input: {
    backgroundColor: '#333',
    color: '#ffffff',
    paddingVertical: 0,
    paddingHorizontal: 12,
    borderRadius: 8,
    fontSize: 16,
    height: 40,
  },
});

export default WorkoutSearchInput;