import React, { useEffect, useState } from "react";
import { RefreshControl } from "react-native";
import { YStack, XStack, ScrollView } from "tamagui";
import Text from "@/components/atoms/core/Text";
import Button from "@/components/atoms/core/Button";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useNetworkQuality } from "@/hooks/useNetworkQuality";
import { LeaderboardEntry, FormattedLeaderboardEntry } from "@/types";
import { useRouter } from "expo-router";
import LeaderboardItem from "@/components/atoms/LeaderboardItem";
import { useWorkoutStore } from "@/stores/workout/WorkoutStore";
import WorkoutPreviewSheet from "@/components/molecules/workout/WorkoutPreviewSheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface LeaderboardScreenProps {
  isActive?: boolean;
}

const EmptyState = () => (
  <YStack flex={1} justifyContent="center" alignItems="center" padding="$8">
    <Text size="medium" marginBottom="$2">
      💪
    </Text>
    <Text size="medium" fontWeight="600" textAlign="center" marginBottom="$2">
      No bicep champions yet
    </Text>
    <Text size="medium" color="$textMuted" textAlign="center">
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
    <Text size="medium" color="$red10" textAlign="center" marginBottom="$4">
      {error}
    </Text>
    <Button onPress={onRetry}>Try Again</Button>
  </YStack>
);

export const LeaderboardScreen = ({
  isActive = true,
}: LeaderboardScreenProps) => {
  const router = useRouter();
  const { isUnreliable } = useNetworkQuality();
  const { formattedEntries, loading, error, refresh, clearError, hasEntries } =
    useLeaderboard();
  const { getPublicWorkout } = useWorkoutStore();
  const insets = useSafeAreaInsets();

  // Sheet state
  const [selectedWorkoutIds, setSelectedWorkoutIds] = useState<string[]>([]);
  const [showUnderConstruction, setShowUnderConstruction] = useState(false);

  const handleRefresh = async () => {
    clearError();
    await refresh();
  };

  useEffect(() => {
    if (isActive) {
      setShowUnderConstruction(true);
    }
  }, [isActive]);

  const previousIsUnreliable = React.useRef(isUnreliable);
  useEffect(() => {
    if (previousIsUnreliable.current && !isUnreliable && isActive) {
      // We just became reliable again, refresh!
      handleRefresh();
    }
    previousIsUnreliable.current = isUnreliable;
  }, [isUnreliable, isActive]);

  const handleEntryTap = (entry: FormattedLeaderboardEntry) => {
    if (entry.workout_id) {
      getPublicWorkout(entry.workout_id);
      setSelectedWorkoutIds([entry.workout_id]);
    }
  };

  const handleCloseSheet = () => {
    setSelectedWorkoutIds([]);
  };

  if (isUnreliable) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$8">
        <Text size="medium" color="$red10" textAlign="center" marginBottom="$4">
          Please reconnect to view leaderboard
        </Text>
      </YStack>
    );
  }

  if (error) {
    return <ErrorState error={error} onRetry={handleRefresh} />;
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Header */}
      <XStack
        paddingTop={insets.top}
        paddingHorizontal="$4"
        paddingBottom="$2"
        alignItems="center"
        justifyContent="space-between"
      >
        <Text size="medium" fontWeight="700">
          Bicep Leaderboard
        </Text>
        <Text size="medium" color="$textMuted">
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
          <YStack paddingBottom={insets.bottom + 60}>
            {formattedEntries.map((entry) => (
              <LeaderboardItem
                key={`${entry.user_id}-${entry.workout_id}-${entry.exercise_id}`}
                entry={entry}
                onTap={handleEntryTap}
              />
            ))}
          </YStack>
        )}
      </ScrollView>

      <WorkoutPreviewSheet
        workoutIds={selectedWorkoutIds}
        onClose={handleCloseSheet}
      />
    </YStack>
  );
};
