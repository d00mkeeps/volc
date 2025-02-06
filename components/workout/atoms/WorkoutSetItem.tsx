import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WorkoutSet } from '@/types/workout';

interface WorkoutSetItemProps {
  set: WorkoutSet;
  isLastSet: boolean;
  activeFields: {
    weight: boolean;
    reps: boolean;
    rpe: boolean;
    distance: boolean;
    duration: boolean;
  };
}

const WorkoutSetItem: React.FC<WorkoutSetItemProps> = ({ set, isLastSet, activeFields }) => {
  return (
    <View style={[styles.container, !isLastSet && styles.bottomBorder]}>
      <Text style={styles.setText}>{set.set_number}</Text>
      {activeFields.weight && (
        <Text style={styles.setText}>{set.weight ?? '-'}</Text>
      )}
      {activeFields.reps && (
        <Text style={styles.setText}>{set.reps ?? '-'}</Text>
      )}
      {activeFields.rpe && (
        <Text style={styles.setText}>{set.rpe ? `RPE ${set.rpe}` : '-'}</Text>
      )}
      {activeFields.distance && (
        <Text style={styles.setText}>{set.distance ?? '-'}</Text>
      )}
      {activeFields.duration && (
        <Text style={styles.setText}>{set.duration ? `${set.duration}s` : '-'}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  bottomBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  setText: {
    color: '#bbb',
    fontSize: 14,
    flex: 1,
    textAlign: 'center',
  },
});

export default WorkoutSetItem;