// stores/dashboardStore.ts
import { create } from 'zustand';

interface GoalProgressData {
  percentage: number;
  currentValue: string;
  targetValue: string;
  label: string;
}

interface MuscleData {
  muscle: string;
  sets: number;
}

interface ConsistencyData {
  workoutDays: number[];
  streak: number;
  totalWorkouts: number;
  score: number;
}

interface DashboardStore {
  // Data
  goalProgress: GoalProgressData | null;
  muscleBalance: MuscleData[] | null;
  consistency: ConsistencyData | null;
  
  // State
  isLoading: boolean;
  lastUpdated: Date | null;
  error: string | null;
  
  // Actions
  refreshDashboard: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  // Initial state
  goalProgress: null,
  muscleBalance: null,
  consistency: null,
  isLoading: false,
  lastUpdated: null,
  error: null,
  
  // Actions
  refreshDashboard: async () => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with actual API call
      // For now, using mock data to test the flow
      const mockData = {
        goalProgress: {
          percentage: 75,
          currentValue: "90kg",
          targetValue: "120kg",
          label: "30kg to goal"
        },
        muscleBalance: [
          { muscle: "Chest", sets: 24 },
          { muscle: "Back", sets: 28 },
          { muscle: "Shoulders", sets: 18 },
          { muscle: "Arms", sets: 22 },
          { muscle: "Legs", sets: 16 },
          { muscle: "Core", sets: 20 }
        ],
        consistency: {
          workoutDays: [1, 3, 5, 8, 10, 12, 14],
          streak: 3,
          totalWorkouts: 7,
          score: 85
        }
      };
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      set({ 
        goalProgress: mockData.goalProgress,
        muscleBalance: mockData.muscleBalance,
        consistency: mockData.consistency,
        isLoading: false,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to load dashboard data'
      });
    }
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error })
}));