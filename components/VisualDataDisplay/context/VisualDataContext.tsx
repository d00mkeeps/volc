import React, { createContext, useState, useContext, useMemo } from 'react';
import { Workout } from '@/types';

interface VisualDataContextType {
  selectedExercises: string[];
  setSelectedExercises: React.Dispatch<React.SetStateAction<string[]>>;
  timeframe: string;
  setTimeframe: React.Dispatch<React.SetStateAction<string>>;
  workoutData: Workout[];
  setWorkoutData: React.Dispatch<React.SetStateAction<Workout[]>>;
}

const VisualDataContext = createContext<VisualDataContextType | undefined>(undefined);

export const VisualDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [timeframe, setTimeframe] = useState<string>('last week');
  const [workoutData, setWorkoutData] = useState<Workout[]>([]);

  const value = useMemo(() => ({
    selectedExercises,
    setSelectedExercises,
    timeframe,
    setTimeframe,
    workoutData,
    setWorkoutData,
  }), [selectedExercises, timeframe, workoutData]);

  return (
    <VisualDataContext.Provider value={value}>
      {children}
    </VisualDataContext.Provider>
  );
};

export const useVisualData = () => {
  const context = useContext(VisualDataContext);
  if (context === undefined) {
    throw new Error('useVisualData must be used within a VisualDataProvider');
  }
  return context;
};