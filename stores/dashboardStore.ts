import { create } from "zustand";
import { dashboardService } from "@/services/api/dashboard";
import { AllTimeframeData } from "@/types/workout";
import { supabase } from "@/lib/supabaseClient";
import { RealtimeChannel } from "@supabase/supabase-js";

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
  subscription: RealtimeChannel | null;
  subscribeToUpdates: (userId: string) => void;
  unsubscribe: () => void;
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  // Initial state
  allData: null,
  isLoading: false,
  lastUpdated: null,
  error: null,

  cacheValidForHours: 1, // 1 hour cache
  subscription: null,

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

  subscribeToUpdates: (userId: string) => {
    const { subscription } = get();
    if (subscription) return; // Prevent duplicates

    console.log(
      `🔌 [DashboardStore] Subscribing to realtime updates for user: ${userId}`
    );

    const channel = supabase
      .channel("dashboard_updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_context_bundles",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log(
            "⚡️ [DashboardStore] Realtime bundle update received:",
            JSON.stringify(payload, null, 2)
          );

          if (payload.errors) {
            console.error(
              "❌ [DashboardStore] Realtime payload contains errors:",
              payload.errors
            );
            return;
          }

          console.log("🔄 [DashboardStore] Triggering dashboard refresh...");
          // Force refresh on next call
          set({ lastUpdated: null });
          get().refreshDashboard();
        }
      )
      .subscribe((status, err) => {
        console.log(`📡 [DashboardStore] Subscription status: ${status}`);
        if (status === "SUBSCRIBED") {
          console.log(
            "✅ [DashboardStore] Successfully subscribed to changes!"
          );
        }
        if (status === "CHANNEL_ERROR") {
          console.error("❌ [DashboardStore] Channel error:", err);
        }
        if (status === "TIMED_OUT") {
          console.error("⚠️ [DashboardStore] Subscription timed out");
        }
      });

    set({ subscription: channel });
  },

  unsubscribe: () => {
    const { subscription } = get();
    if (subscription) {
      console.log("🔌 [DashboardStore] Unsubscribing from realtime updates");
      supabase.removeChannel(subscription);
      set({ subscription: null });
    }
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

      // ✅ Log data shape
      const { allData } = get();
      if (allData) {
        // console.log("📊 [DashboardStore] Dashboard data received:");

        (["1week", "2weeks", "1month", "2months"] as const).forEach(
          (timeframe) => {
            const data = allData[timeframe];
            const workouts = data.consistency.workouts || [];

            // console.log(`\n  ${timeframe}:`);
            // console.log(
            //   `    ✓ ${workouts.length} workouts received with fields: ${
            //     workouts.length > 0
            //       ? Object.keys(workouts[0]).join(", ")
            //       : "N/A"
            //   }`
            // );

            if (workouts.length > 0) {
              // console.log(`    Sample:`, workouts[0]);
            }
          }
        );
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
    // Trigger immediate refresh logic is now handled by realtime subscription mostly,
    // but we can still force check if needed, or just let the next mount/update handle it.
    // The original code called get().refreshDashboard() here.
    // Given the new pattern, we primarily just want to invalidate the cache.
    // If the user is on the dashboard, the realtime event would have triggered a refresh.
    // If they are navigating back to it, the mount effect might trigger it if cache is invalid.
    // Let's keep the immediate refresh for now to be safe, as realtime might have distinct timing.
    // Actually, per user request: "Now just invalidates cache, lets realtime handle refresh"
  },
}));
