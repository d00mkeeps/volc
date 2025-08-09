import { create } from "zustand";
import {
  leaderboardService,
  LeaderboardEntry,
} from "@/services/api/leaderboardService";

interface LeaderboardState {
  entries: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  lastRefresh: Date | null;

  // Actions
  fetchLeaderboard: () => Promise<void>;
  refreshLeaderboard: () => Promise<void>;
  clearError: () => void;
}

export const useLeaderboardStore = create<LeaderboardState>((set, get) => ({
  entries: [],
  loading: false,
  error: null,
  lastRefresh: null,

  fetchLeaderboard: async () => {
    const { lastRefresh, loading } = get();

    // Skip if already loading or data is fresh (< 5 minutes)
    if (
      loading ||
      (lastRefresh && Date.now() - lastRefresh.getTime() < 5 * 60 * 1000)
    ) {
      return;
    }

    set({ loading: true, error: null });

    try {
      const entries = await leaderboardService.getBicepLeaderboard();
      set({
        entries,
        loading: false,
        lastRefresh: new Date(),
      });
    } catch (error) {
      set({
        loading: false,
        error:
          error instanceof Error ? error.message : "Failed to load leaderboard",
      });
    }
  },

  refreshLeaderboard: async () => {
    set({ loading: true, error: null });

    try {
      const entries = await leaderboardService.getBicepLeaderboard();
      set({
        entries,
        loading: false,
        lastRefresh: new Date(),
      });
    } catch (error) {
      set({
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to refresh leaderboard",
      });
    }
  },

  clearError: () => set({ error: null }),
}));
