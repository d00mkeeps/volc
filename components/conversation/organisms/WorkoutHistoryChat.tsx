import { useCallback } from "react";
import ChatUI from "./ChatUI";

interface WorkoutHistory {
  trainingAge: string;
  exercisePreferences: string[];
  achievements: string[];
  medicalConsiderations: string[];
}

interface WorkoutHistoryProps {
  onComplete?: (workoutHistory: WorkoutHistory) => void;
}

export const WorkoutHistoryChat: React.FC<WorkoutHistoryProps> = ({
  onComplete
}) => {
  const handleSignal = useCallback((type: string, data: any) => {
    if (type === 'workout_history_approved' && data) {
      console.log('WorkoutHistoryChat: Received workout history', data);
      onComplete?.(data as WorkoutHistory);
    }
  }, [onComplete]);

  return (
    <ChatUI
      configName="workout-history"
      title="Workout History"
      subtitle="Analyzing your fitness journey"
      signalHandler={handleSignal}
    />
  );
};