// services/dashboardService.ts
import { apiGet } from './core/apiClient';

interface DashboardResponse {
  goalProgress: {
    percentage: number;
    currentValue: string;
    targetValue: string;
    label: string;
  };
  muscleBalance: Array<{
    muscle: string;
    sets: number;
  }>;
  consistency: {
    workoutDays: number[];
    streak: number;
    totalWorkouts: number;
    score: number;
  };
}

export const dashboardService = {
  getDashboardData: async (): Promise<DashboardResponse> => {
    return apiGet<DashboardResponse>('/api/dashboard');
  }
};