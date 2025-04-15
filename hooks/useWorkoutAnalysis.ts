import { useState } from 'react';
import { useMessage } from '@/context/MessageContext';
import { useRouter } from 'expo-router';
import { CompleteWorkout } from '@/types/workout';
import { getWebSocketService } from '@/services/websocket/GlobalWebsocketService';
import Toast from 'react-native-toast-message';

export function useWorkoutAnalysis() {
  const { startNewConversation, loadConversation } = useMessage();
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);


const analyzeWorkout = async (workout: CompleteWorkout) => {
  try {
    setIsAnalyzing(true);
    
    // Log the workout to be analyzed
    console.log("🔍 Analyzing workout:", {
      id: workout.id,
      name: workout.name,
      exerciseCount: workout.workout_exercises?.length || 0,
      exercises: workout.workout_exercises?.map(ex => ex.name).slice(0, 3) || []
    });
    
    const message = `Analyze my "${workout.name}" workout and show how it relates to my previous workouts. Look for patterns and progress.`;
    const conversationId = await startNewConversation(message, 'workout-analysis');
    console.log(`🔗 Conversation created: ${conversationId}`);
    
    await loadConversation(conversationId);
    console.log(`📂 Conversation loaded`);
    
    const webSocketService = getWebSocketService();
    await webSocketService.connect('workout-analysis', conversationId);
    console.log(`🔌 WebSocket connected to workout-analysis/${conversationId}`);
    
    // Ensure connection is established before sending data
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Prepare and log the payload
    const workoutData = JSON.stringify(workout);
    console.log(`📦 Workout data serialized: ${workoutData.length} bytes`);
    
    const payload = {
      type: 'analyze_workout',
      message,
      data: workoutData,
      conversation_id: conversationId
    };
    
    console.log(`📤 Sending analyze_workout request`);
    webSocketService.sendMessage(payload);
    console.log(`✅ Sent workout data for analysis: ${workout.name}`);
    
    router.push({pathname: "/conversation/[id]", params: {id: conversationId}});
    return conversationId;
  } catch (error) {
    console.error('❌ Failed to analyze workout:', error);
    Toast.show({type: 'error', text1: 'Analysis failed'});
    throw error;
  } finally {
    setIsAnalyzing(false);
  }
};
  return { analyzeWorkout, isAnalyzing };
}