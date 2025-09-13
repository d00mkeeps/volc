import React from "react";
import { YStack, XStack, Circle } from "tamagui";
import Text from "@/components/atoms/core/Text";
import { LeaderboardEntry } from "@/services/api/leaderboardService";

interface LeaderboardItemProps {
  entry: LeaderboardEntry;
  onTap: (entry: LeaderboardEntry) => void;
}

export default function LeaderboardItem({
  entry,
  onTap,
}: LeaderboardItemProps) {
  const getTrophyEmoji = (rank: number): string | null => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  };

  const isTop3 = entry.rank <= 3;
  const trophy = getTrophyEmoji(entry.rank);

  return (
    <XStack
      backgroundColor={isTop3 ? "$backgroundHover" : "$background"}
      padding="$4"
      marginHorizontal="$4"
      marginVertical="$2"
      borderRadius="$4"
      alignItems="center"
      pressStyle={{ opacity: 0.7 }}
      onPress={() => onTap(entry)}
    >
      {/* Rank Badge */}
      <XStack width={40} justifyContent="center" alignItems="center">
        {trophy ? (
          <Text size="medium">{trophy}</Text>
        ) : (
          <Circle
            size={30}
            backgroundColor="$borderColor"
            alignItems="center"
            justifyContent="center"
          >
            <Text size="medium" fontWeight="600">
              {entry.rank}
            </Text>
          </Circle>
        )}
      </XStack>

      {/* User Info */}
      <YStack flex={1} paddingLeft="$3">
        <Text size="medium" fontWeight="600">
          {entry.first_name} {entry.last_name}
        </Text>
        <Text size="medium" color="$textMuted">
          {entry.exercise_name}
        </Text>
        <Text size="medium" color="$textMuted">
          {new Date(entry.performed_at).toLocaleDateString()}
        </Text>
      </YStack>

      {/* Performance Stats */}
      <YStack alignItems="flex-end">
        <Text size="medium" fontWeight="700" color="$primary">
          {entry.estimated_1rm}kg
        </Text>
        {entry.verified && (
          <Text size="medium" color="$green10">
            ✓ Verified
          </Text>
        )}
      </YStack>
    </XStack>
  );
}
