// stores/dashboardStore.ts
import { create } from 'zustand';
import { dashboardService } from '@/services/api/dashboard';

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
      const data = await dashboardService.getDashboardData();
      
      set({ 
        goalProgress: data.goalProgress,
        muscleBalance: data.muscleBalance,
        consistency: data.consistency,
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