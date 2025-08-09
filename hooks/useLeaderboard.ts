import { useEffect } from "react";
import { useLeaderboardStore } from "@/stores/leaderboardStore";

export function useLeaderboard() {
  const {
    entries,
    loading,
    error,
    fetchLeaderboard,
    refreshLeaderboard,
    clearError,
  } = useLeaderboardStore();

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const isTop3 = (userId: string): boolean => {
    const entry = entries.find((e) => e.user_id === userId);
    return entry?.rank ? entry.rank <= 3 : false;
  };

  const getTrophyEmoji = (rank: number): string | null => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  };

  const getUserRank = (userId: string): number | null => {
    return entries.find((e) => e.user_id === userId)?.rank || null;
  };

  return {
    entries,
    loading,
    error,
    refresh: refreshLeaderboard,
    clearError,
    isTop3,
    getTrophyEmoji,
    getUserRank,
    hasEntries: entries.length > 0,
  };
}
