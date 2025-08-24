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
    console.log("🧹 [DashboardStore] Clearing dashboard cache");
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

    console.log("🔄 [DashboardStore] refreshDashboard called");
    console.log("🔍 [DashboardStore] shouldRefresh:", shouldRefresh());

    // Don't refresh if cache is still valid
    if (!shouldRefresh()) {
      console.log(
        "⏭️ [DashboardStore] Dashboard cache still valid, skipping refresh"
      );
      return;
    }

    console.log("🚀 [DashboardStore] Starting API call...");
    set({ isLoading: true, error: null });

    try {
      // Call API - returns all timeframes
      console.log(
        "📡 [DashboardStore] Calling dashboardService.getAllDashboardData()..."
      );
      const response = await dashboardService.getAllDashboardData();

      console.log("✅ [DashboardStore] API Response received:");
      console.log("📊 [DashboardStore] Response type:", typeof response);
      console.log(
        "📊 [DashboardStore] Response keys:",
        response ? Object.keys(response) : "null"
      );
      console.log(
        "📊 [DashboardStore] Full response:",
        JSON.stringify(response, null, 2)
      );

      // Check specific timeframe data
      if (response && response["2weeks"]) {
        console.log("🔍 [DashboardStore] 2weeks data exists:");
        console.log(
          "📈 [DashboardStore] 2weeks actualMetrics:",
          response["2weeks"].actualMetrics
        );
        console.log(
          "💪 [DashboardStore] 2weeks muscleBalance:",
          response["2weeks"].muscleBalance
        );
        console.log(
          "📅 [DashboardStore] 2weeks consistency:",
          response["2weeks"].consistency
        );
      } else {
        console.log("❌ [DashboardStore] 2weeks data missing or undefined");
      }

      set({
        allData: response,
        isLoading: false,
        lastUpdated: new Date(),
        error: null,
      });

      // Log what we actually set in the store
      console.log("💾 [DashboardStore] Data saved to store");
      const { allData } = get();
      console.log("🔍 [DashboardStore] Store state after save:");
      console.log(
        "📊 [DashboardStore] allData keys:",
        allData ? Object.keys(allData) : "null"
      );

      if (allData && allData["2weeks"]) {
        console.log(
          "📈 [DashboardStore] Store 2weeks actualMetrics:",
          allData["2weeks"].actualMetrics
        );
      }

      console.log(
        "✅ [DashboardStore] Dashboard data refresh completed successfully"
      );
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
    console.log(
      "🔄 [DashboardStore] Dashboard cache invalidated - workout completed"
    );
    set({
      lastUpdated: null, // Force refresh on next call
      error: null,
    });
    // Trigger immediate refresh
    get().refreshDashboard();
  },
}));
