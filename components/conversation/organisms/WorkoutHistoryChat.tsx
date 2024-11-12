import { useCallback } from "react";
import ChatUI from "./ChatUI";

interface WorkoutHistoryProps {
  onComplete?: () => void;
}

export const WorkoutHistoryChat: React.FC<WorkoutHistoryProps> = ({
  onComplete
}) => {
  const handleSignal = useCallback((type: string, data: any) => {
    if (type === 'workout_history_approved') {
      onComplete?.();
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