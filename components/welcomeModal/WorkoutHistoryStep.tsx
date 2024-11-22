import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { WorkoutHistoryChat } from '@/components/conversation/organisms/WorkoutHistoryChat';

interface WorkoutHistoryStepProps {
  wizardRef?: React.RefObject<any>;
}

interface WorkoutHistory {
  trainingAge: string;
  exercisePreferences: string[];
  achievements: string[];
  medicalConsiderations: string[];
}

export const WorkoutHistoryStep: React.FC<WorkoutHistoryStepProps> = ({ 
  wizardRef 
}) => {
  const handleComplete = useCallback((workoutHistory: WorkoutHistory) => {
    console.log('WorkoutHistoryStep: Collection complete');
    
    // Log the complete workout history
    console.log('Workout History:', {
      trainingAge: workoutHistory.trainingAge,
      exercisePreferences: workoutHistory.exercisePreferences,
      achievements: workoutHistory.achievements,
      medicalConsiderations: workoutHistory.medicalConsiderations
    });
    
    if (wizardRef?.current) {
      console.log('WorkoutHistoryStep: Advancing wizard');
      wizardRef.current.next();
    } else {
      console.warn('WorkoutHistoryStep: wizardRef not available');
    }
  }, [wizardRef]);
 
  return (
    <View style={styles.container}>
      <WorkoutHistoryChat 
        onComplete={handleComplete}
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