import { create } from "zustand";
import { dashboardService } from "@/services/api/dashboard";
import { AllTimeframeData } from "@/types/workout";

interface DashboardStore {
  // Data - complete object from API
  allData: AllTimeframeData | null;
  // State
  isLoading: boolean;
  lastUpdated: Date | null;
  error: string | null;
  cacheValidForHours: number;
  // Actions
  clearData: () => void;
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

  clearData: () => {
    set({
      allData: null,
      isLoading: false,
      lastUpdated: null,
      error: null,
    });
  },

  // Main refresh method - calls API
  refreshDashboard: async () => {
    const { shouldRefresh } = get();
    // Don't refresh if cache is still valid
    if (!shouldRefresh()) {
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

      const { allData } = get();

      if (allData && allData["2weeks"]) {
        console.log("[DashboardStore] all good!");
      }
    } catch (error) {
      console.error("❌ [DashboardStore] Failed to refresh dashboard:", error);
      console.error("🚨 [DashboardStore] Error details:", {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : "No stack",
      });

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
    set({
      lastUpdated: null, // Force refresh on next call
      error: null,
    });
    // Trigger immediate refresh
    get().refreshDashboard();
  },
}));
