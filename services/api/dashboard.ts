import { apiGet } from "./core/apiClient";

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

interface TimeframeData {
  muscleBalance: MuscleData[];
  consistency: ConsistencyData;
}

interface AllTimeframeData {
  "1week": TimeframeData;
  "2weeks": TimeframeData;
  "1month": TimeframeData;
  "2months": TimeframeData;
  lastUpdated: string;
}

export const dashboardService = {
  getAllDashboardData: async (): Promise<AllTimeframeData> => {
    return apiGet<AllTimeframeData>("/api/dashboard");
  },
};
