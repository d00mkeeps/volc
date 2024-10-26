import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WorkoutHistoryChat } from './WorkoutHistoryChat';

interface WorkoutHistoryStepProps {
  wizardRef?: React.RefObject<any>; 
}

export const WorkoutHistoryStep: React.FC<WorkoutHistoryStepProps> = ({ wizardRef }) => {
  const handleCollectionComplete = () => {
    if (wizardRef?.current) {
      wizardRef.current.next();
    }
  };

  return (
    <View style={styles.container}>
      <WorkoutHistoryChat 
        onCollectionComplete={handleCollectionComplete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
});