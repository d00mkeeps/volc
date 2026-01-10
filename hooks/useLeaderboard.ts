import { useEffect, useMemo } from "react";
import { useLeaderboardStore } from "@/stores/leaderboardStore";
import { useUserStore } from "@/stores/userProfileStore";
import { FormattedLeaderboardEntry } from "@/types";

export function useLeaderboard() {
  const {
    entries,
    loading,
    error,
    fetchLeaderboard,
    refreshLeaderboard,
    clearError,
  } = useLeaderboardStore();

  const { userProfile } = useUserStore();

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const formattedEntries: FormattedLeaderboardEntry[] = useMemo(() => {
    const isImperial = userProfile?.is_imperial ?? false;

    return entries.map((entry) => {
      let displayWeight: string;
      let displayUnit: "lbs" | "kg";

      if (isImperial) {
        // Convert kg to lbs: 1 kg = 2.20462 lbs
        const weightLbs = entry.estimated_1rm * 2.20462;
        displayWeight = weightLbs.toFixed(1);
        displayUnit = "lbs";
      } else {
        displayWeight = entry.estimated_1rm.toFixed(1);
        displayUnit = "kg";
      }

      return {
        ...entry,
        display_weight: displayWeight,
        display_unit: displayUnit,
      };
    });
  }, [entries, userProfile?.is_imperial]);

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
    entries, // Keeping raw entries available if needed
    formattedEntries,
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
