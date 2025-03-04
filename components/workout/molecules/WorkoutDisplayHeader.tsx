// components/workout/molecules/WorkoutDisplayHeader.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import WorkoutSearchInput from '../atoms/WorkoutSearchInput';

interface WorkoutDisplayHeaderProps {
  value: string;
  onSearchChange: (value: string) => void;
}

const WorkoutDisplayHeader: React.FC<WorkoutDisplayHeaderProps> = ({ 
  value, 
  onSearchChange 
}) => {
  return (
    <View style={styles.container}>
      <WorkoutSearchInput
        value={value}
        onChangeText={onSearchChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
});

export default WorkoutDisplayHeader;