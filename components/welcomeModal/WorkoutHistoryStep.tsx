import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WorkoutHistoryChat } from '@/components/conversation/organisms/WorkoutHistoryChat';

interface WorkoutHistoryStepProps {
 wizardRef?: React.RefObject<any>;
}

export const WorkoutHistoryStep: React.FC<WorkoutHistoryStepProps> = ({ 
  wizardRef 
 }) => {
  const handleCollectionComplete = () => {
    console.log('WorkoutHistoryStep: Collection complete triggered');
    if (wizardRef?.current) {
      console.log('WorkoutHistoryStep: Advancing wizard');
      wizardRef.current.next();
    } else {
      console.warn('WorkoutHistoryStep: wizardRef not available');
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