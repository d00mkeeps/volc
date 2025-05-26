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
      // Your API call here
      const response = await fetch('/api/dashboard');
      return response.json();
    }
  };