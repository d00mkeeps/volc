import React from "react";
import { RefreshControl } from "react-native";
import { YStack, XStack, Text, ScrollView, Circle, Button } from "tamagui";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { LeaderboardEntry } from "@/services/api/leaderboardService";

interface LeaderboardEntryProps {
  entry: LeaderboardEntry;
  onTap: (entry: LeaderboardEntry) => void;
}

const LeaderboardEntryItem = ({ entry, onTap }: LeaderboardEntryProps) => {
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
          <Text fontSize="$6">{trophy}</Text>
        ) : (
          <Circle
            size={30}
            backgroundColor="$borderColor"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize="$3" fontWeight="600">
              {entry.rank}
            </Text>
          </Circle>
        )}
      </XStack>

      {/* User Info */}
      <YStack flex={1} paddingLeft="$3">
        <Text fontSize="$4" fontWeight="600">
          {entry.first_name} {entry.last_name}
        </Text>
        <Text fontSize="$3" color="$textMuted">
          {entry.exercise_name}
        </Text>
        <Text fontSize="$2" color="$textMuted">
          {new Date(entry.performed_at).toLocaleDateString()}
        </Text>
      </YStack>

      {/* Performance Stats */}
      <YStack alignItems="flex-end">
        <Text fontSize="$5" fontWeight="700" color="$primary">
          {entry.estimated_1rm}kg
        </Text>
        {entry.verified && (
          <Text fontSize="$1" color="$green10">
            ✓ Verified
          </Text>
        )}
      </YStack>
    </XStack>
  );
};

const EmptyState = () => (
  <YStack flex={1} justifyContent="center" alignItems="center" padding="$8">
    <Text fontSize="$6" marginBottom="$2">
      💪
    </Text>
    <Text fontSize="$5" fontWeight="600" textAlign="center" marginBottom="$2">
      No bicep champions yet
    </Text>
    <Text fontSize="$3" color="$textMuted" textAlign="center">
      Complete a bicep workout to see your name on the leaderboard
    </Text>
  </YStack>
);

const ErrorState = ({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) => (
  <YStack flex={1} justifyContent="center" alignItems="center" padding="$8">
    <Text fontSize="$4" color="$red10" textAlign="center" marginBottom="$4">
      {error}
    </Text>
    <Button onPress={onRetry} theme="blue">
      Try Again
    </Button>
  </YStack>
);

export const LeaderboardScreen = () => {
  const { entries, loading, error, refresh, clearError, hasEntries } =
    useLeaderboard();

  const handleEntryTap = (entry: LeaderboardEntry) => {
    console.log(
      `${entry.exercise_name} by ${entry.first_name} ${entry.last_name} at rank ${entry.rank} has just been tapped!`
    );
  };

  const handleRefresh = async () => {
    clearError();
    await refresh();
  };

  if (error) {
    return <ErrorState error={error} onRetry={handleRefresh} />;
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Header */}
      <XStack padding="$4" alignItems="center" justifyContent="space-between">
        <Text fontSize="$7" fontWeight="700">
          Bicep Leaderboard
        </Text>
        <Text fontSize="$3" color="$textMuted">
          Last 14 days
        </Text>
      </XStack>

      {/* Content */}
      <ScrollView
        flex={1}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {!hasEntries ? (
          <EmptyState />
        ) : (
          <YStack paddingBottom="$4">
            {entries.map((entry) => (
              <LeaderboardEntryItem
                key={`${entry.user_id}-${entry.workout_id}-${entry.exercise_id}`}
                entry={entry}
                onTap={handleEntryTap}
              />
            ))}
          </YStack>
        )}
      </ScrollView>
    </YStack>
  );
};
