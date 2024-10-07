import React from 'react';
import { View, StyleSheet } from 'react-native';
import WorkoutSearchInput from '../atoms/WorkoutSearchInput';
import CalendarButton from '../atoms/CalendarButton';

interface WorkoutDisplayHeaderProps {
  searchValue: string;
  onSearchChange: (text: string) => void;
}

const WorkoutDisplayHeader: React.FC<WorkoutDisplayHeaderProps> = ({ searchValue, onSearchChange }) => (
  <View style={styles.container}>
    <WorkoutSearchInput value={searchValue} onChangeText={onSearchChange} />
    <CalendarButton />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#666',
  },
});

export default WorkoutDisplayHeader;