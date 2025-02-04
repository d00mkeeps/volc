import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WorkoutSet } from '@/types/workout';

interface WorkoutSetItemProps {
  set: WorkoutSet;
  isLastSet: boolean;
}

const WorkoutSetItem: React.FC<WorkoutSetItemProps> = ({ set, isLastSet }) => {
  return (
    <View style={[styles.container, !isLastSet && styles.bottomBorder]}>
      <Text style={styles.setText}>{set.set_number}</Text>
      {set.weight && <Text style={styles.setText}>{set.weight}</Text>}
      {set.reps && <Text style={styles.setText}>{set.reps}</Text>}
      {set.rpe && <Text style={styles.setText}>RPE {set.rpe}</Text>}
      {set.distance && <Text style={styles.setText}>{set.distance}</Text>}
      {set.duration && <Text style={styles.setText}>{set.duration}s</Text>}
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