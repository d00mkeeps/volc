import React, { useEffect, useState } from "react";
import { RefreshControl } from "react-native";
import { YStack, XStack, ScrollView } from "tamagui";
import Text from "@/components/atoms/core/Text";
import Button from "@/components/atoms/core/Button";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { LeaderboardEntry } from "@/services/api/leaderboardService";
// import WorkoutViewModal from "@/components/organisms/workout/WorkoutViewModal";
import { useRouter } from "expo-router";
import LeaderboardItem from "@/components/atoms/LeaderboardItem";
import { useWorkoutStore } from "@/stores/workout/WorkoutStore";

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
  const { entries, loading, error, refresh, clearError, hasEntries } =
    useLeaderboard();
  const { getPublicWorkout } = useWorkoutStore();

  // Modal state
  const [selectedWorkout, setSelectedWorkout] =
    useState<LeaderboardEntry | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showUnderConstruction, setShowUnderConstruction] = useState(false);
  useEffect(() => {
    if (isActive) {
      setShowUnderConstruction(true);
    }
  }, [isActive]);

  const handleEntryTap = (entry: LeaderboardEntry) => {
    setSelectedWorkout(entry);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedWorkout(null);
  };

  const handleUnderConstructionConfirm = () => {
    router.replace("/");
    setShowUnderConstruction(false);
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
          <YStack paddingBottom="$4">
            {entries.map((entry) => (
              <LeaderboardItem
                key={`${entry.user_id}-${entry.workout_id}-${entry.exercise_id}`}
                entry={entry}
                onTap={handleEntryTap}
              />
            ))}
          </YStack>
        )}
      </ScrollView>

      {/* <WorkoutViewModal
        isVisible={modalVisible}
        onClose={handleCloseModal}
        workoutId={selectedWorkout?.workout_id || ""}
        userId={selectedWorkout?.user_id || ""}
      /> */}
    </YStack>
  );
};
