import React, { useEffect } from 'react';
import { View } from 'react-native';
import ChatUI from '../conversation/organisms/ChatUI';
import { useMessage } from '@/context/MessageContext';
import { showNotification } from '@/utils/notifications';

interface WorkoutHistoryChatProps {
  onCollectionComplete?: () => void;
}

export const WorkoutHistoryChat: React.FC<WorkoutHistoryChatProps> = ({ 
  onCollectionComplete 
}) => {
  const { registerMessageHandler } = useMessage();

  useEffect(() => {
    if (registerMessageHandler) {
      registerMessageHandler((type, data) => {
        if (type === 'workout_history_complete') {
          console.log('Workout history collection complete:', data);
          
          showNotification(
            'Success',
            'Your workout history has been collected successfully!'
          );

          setTimeout(() => {
            onCollectionComplete?.();
          }, 500);
        }
      });
    }
  }, [registerMessageHandler, onCollectionComplete]);

  return (
    <View style={{ flex: 1 }}>
      <ChatUI 
        configName="workout-history"
        title="Workout History"
        subtitle="Let's learn about your fitness journey"
      />
    </View>
  );
};