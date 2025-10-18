import React, { useEffect, useState } from "react";
import { YStack, ScrollView, Stack, XStack } from "tamagui";
import { RefreshControl } from "react-native";
import { useUserStore } from "@/stores/userProfileStore";
import { useAuth } from "@/context/AuthContext";
import { useWorkoutStore } from "@/stores/workout/WorkoutStore";
import ProfileHeader from "@/components/molecules/headers/ProfileHeader";
import WorkoutListModal from "@/components/organisms/workout/WorkoutListModal";
import WorkoutList from "@/components/molecules/workout/WorkoutList";
import Text from "@/components/atoms/core/Text";
import Button from "@/components/atoms/core/Button";
import LongPressToEdit from "@/components/atoms/core/LongPressToEdit";
import TextEditModal from "@/components/molecules/core/TextEditModal";

export default function ProfileScreen() {
  const { userProfile, loading, error, updateProfile, refreshProfile } =
    useUserStore();
  const { workouts } = useWorkoutStore();
  const { signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [goalsModalVisible, setGoalsModalVisible] = useState(false);

  useEffect(() => {
    console.log("[ProfileScreen] Component mounted");
  }, []);

  const handleAvatarSelected = async (imageId: string) => {
    console.log(`[ProfileScreen] Avatar selected: ${imageId}`);
    await updateProfile({ avatar_image_id: imageId });
  };

  const handleGoalsLongPress = () => {
    setGoalsModalVisible(true);
  };

  const handleGoalsSave = async (goals: string) => {
    await updateProfile({
      goals: goals.trim() ? { content: goals.trim() } : {},
    });
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
    } catch (error) {
      console.error("Failed to refresh profile:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Only show error screen for critical errors, not missing data
  if (error) {
    return (
      <YStack
        flex={1}
        backgroundColor="$background"
        justifyContent="center"
        alignItems="center"
      >
        <Text color="$textSoft">Unable to load profile</Text>
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Navigation Bar */}
      <XStack
        justifyContent="space-between"
        alignItems="center"
        paddingHorizontal="$4"
        paddingTop="$4"
        paddingBottom="$2"
        backgroundColor="$background"
      >
        <Text size="large" fontWeight="600" color="$color">
          Profile
        </Text>
      </XStack>

      <ScrollView
        flex={1}
        padding="$2"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <YStack gap="$3">
          {/* Profile Header */}
          <ProfileHeader
            userProfile={userProfile}
            updateProfile={updateProfile}
            pendingAvatarId={null}
            onAvatarSelected={handleAvatarSelected}
            isEditMode={false}
          />

          {/* Goals Section */}
          <YStack
            backgroundColor="$background"
            borderRadius="$3"
            padding="$3"
            gap="$3"
          >
            <Text size="medium" fontWeight="600" color="$color">
              Goals
            </Text>

            <LongPressToEdit onLongPress={handleGoalsLongPress}>
              <YStack
                backgroundColor="$backgroundSoft"
                borderRadius="$2"
                padding="$3"
              >
                <Text size="medium" color="$color" lineHeight={22}>
                  {userProfile === null
                    ? "Loading..."
                    : userProfile.goals?.content ||
                      Object.values(userProfile.goals || {}).join("\n\n") ||
                      "No goals set"}
                </Text>
              </YStack>
            </LongPressToEdit>
          </YStack>

          {/* Recent Workouts Section */}
          <YStack
            backgroundColor="$background"
            borderRadius="$3"
            paddingHorizontal="$3"
            gap="$3"
          >
            <Text size="medium" fontWeight="600" color="$color">
              Recent Workouts
            </Text>

            <WorkoutList limit={3} />

            {workouts.length > 3 && (
              <XStack justifyContent="flex-end" paddingBottom="$3">
                <Stack
                  backgroundColor="$backgroundSoft"
                  borderRadius="$2"
                  paddingHorizontal="$4"
                  paddingVertical="$2"
                  pressStyle={{ scale: 0.95 }}
                  onPress={() => setShowWorkoutModal(true)}
                  borderWidth={1}
                  borderColor="$borderSoft"
                >
                  <Text size="medium" fontWeight="600" color="$text">
                    View All
                  </Text>
                </Stack>
              </XStack>
            )}
          </YStack>

          {/* Training History */}
          {userProfile?.training_history && (
            <YStack
              backgroundColor="$backgroundSoft"
              borderRadius="$3"
              padding="$3"
              gap="$3"
            >
              <Text size="medium" fontWeight="600" color="$color">
                Training History
              </Text>
              <YStack
                backgroundColor="$backgroundPress"
                borderRadius="$2"
                padding="$3"
              >
                <Text size="medium" color="$color" lineHeight={22}>
                  {Object.values(userProfile.training_history).join("\n\n")}
                </Text>
              </YStack>
            </YStack>
          )}

          <Stack paddingTop="$10">
            <Button
              onPress={handleLogout}
              disabled={isLoggingOut}
              backgroundColor="$red9"
              color="white"
              size="medium"
              borderRadius="$3"
              width="50%"
              alignSelf="center"
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </Button>
          </Stack>
        </YStack>
      </ScrollView>

      {/* Workout modal */}
      <WorkoutListModal
        isVisible={showWorkoutModal}
        onClose={() => setShowWorkoutModal(false)}
      />

      {/* Goals edit modal */}
      <TextEditModal
        isVisible={goalsModalVisible}
        onClose={() => setGoalsModalVisible(false)}
        currentNotes={
          userProfile?.goals?.content ||
          Object.values(userProfile?.goals || {}).join("\n\n") ||
          ""
        }
        onSave={handleGoalsSave}
        title="Edit Goals"
      />
    </YStack>
  );
}
