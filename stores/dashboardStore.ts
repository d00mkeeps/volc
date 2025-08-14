import { create } from "zustand";
import { dashboardService } from "@/services/api/dashboard";

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

interface DashboardStore {
  // Data - complete object from API
  allData: AllTimeframeData | null;

  // State
  isLoading: boolean;
  lastUpdated: Date | null;
  error: string | null;
  cacheValidForHours: number;

  // Actions
  refreshDashboard: () => Promise<void>;
  invalidateAfterWorkout: () => void;
  shouldRefresh: () => boolean;
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  // Initial state
  allData: null,
  isLoading: false,
  lastUpdated: null,
  error: null,
  cacheValidForHours: 1, // 1 hour cache

  // Check if we should refresh (cache expired)
  shouldRefresh: () => {
    const { lastUpdated, cacheValidForHours } = get();
    if (!lastUpdated) return true;

    const hoursSinceUpdate =
      (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);
    return hoursSinceUpdate >= cacheValidForHours;
  },

  // Main refresh method - calls API
  refreshDashboard: async () => {
    const { shouldRefresh } = get();

    // Don't refresh if cache is still valid
    if (!shouldRefresh()) {
      console.log("Dashboard cache still valid, skipping refresh");
      return;
    }

    set({ isLoading: true, error: null });

    try {
      // Call API - returns all timeframes
      const response = await dashboardService.getAllDashboardData();

      set({
        allData: response,
        isLoading: false,
        lastUpdated: new Date(),
        error: null,
      });

      console.log("Dashboard data refreshed successfully");
    } catch (error) {
      console.error("Failed to refresh dashboard:", error);
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load dashboard data",
      });
    }
  },

  // Force refresh after workout completion
  invalidateAfterWorkout: () => {
    console.log("Dashboard cache invalidated - workout completed");
    set({
      lastUpdated: null, // Force refresh on next call
      error: null,
    });

    // Trigger immediate refresh
    get().refreshDashboard();
  },
}));
