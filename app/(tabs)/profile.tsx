import React, { useEffect, useState } from "react";
import { YStack, ScrollView, Stack, TextArea, XStack } from "tamagui";
import { RefreshControl } from "react-native";
import { useUserStore } from "@/stores/userProfileStore";
import { useAuth } from "@/context/AuthContext";
import { useWorkoutStore } from "@/stores/workout/WorkoutStore";
import ProfileHeader from "@/components/molecules/headers/ProfileHeader";
import WorkoutListModal from "@/components/organisms/workout/WorkoutListModal";
import WorkoutList from "@/components/molecules/workout/WorkoutList";
import Text from "@/components/atoms/core/Text";
import Button from "@/components/atoms/core/Button";
import { UserProfile } from "@/types";

const PLACEHOLDER_BIO =
  "This is my fitness journey! I love working out and staying healthy. Always pushing myself to be better than yesterday. 💪";

export default function ProfileScreen() {
  const { userProfile, loading, error, updateProfile, refreshProfile } =
    useUserStore();
  const { workouts } = useWorkoutStore();
  const { signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Edit state for bio and goals
  const [editedBio, setEditedBio] = useState(PLACEHOLDER_BIO);
  const [editedGoals, setEditedGoals] = useState("");

  useEffect(() => {
    console.log("[ProfileScreen] Component mounted");
  }, []);

  // Initialize edit values when entering edit mode
  useEffect(() => {
    if (isEditMode) {
      // Initialize bio
      setEditedBio(PLACEHOLDER_BIO);
      // Initialize goals
      const currentGoals =
        userProfile?.goals?.content ||
        Object.values(userProfile?.goals || {}).join("\n\n") ||
        "";
      setEditedGoals(currentGoals);
    }
  }, [isEditMode, userProfile?.goals]);

  const handleToggleEdit = () => {
    setIsEditMode(!isEditMode);
  };

  const handleSaveAll = async () => {
    try {
      // TODO: Save bio when backend supports it
      console.log("Would save bio:", editedBio);

      // Save goals
      await updateProfile({
        goals: editedGoals.trim() ? { content: editedGoals.trim() } : {},
      });

      setIsEditMode(false);
    } catch (error) {
      console.error("Failed to save changes:", error);
    }
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

  if (loading) {
    return (
      <YStack
        flex={1}
        backgroundColor="$background"
        justifyContent="center"
        alignItems="center"
      >
        <Text color="$textSoft">Loading profile...</Text>
      </YStack>
    );
  }

  if (error || !userProfile) {
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
      {/* Navigation Bar with Edit button */}
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
        <Button
          backgroundColor="transparent"
          color="$primary"
          onPress={isEditMode ? handleSaveAll : handleToggleEdit}
          size="medium"
          fontWeight="400"
          paddingHorizontal="$0"
        >
          {isEditMode ? "Done" : "Edit"}
        </Button>
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
            editingCard={editingCard}
            updateProfile={updateProfile}
            isEditMode={isEditMode}
            editedBio={editedBio}
            onBioChange={setEditedBio}
          />

          {isUpdatingAvatar && (
            <Text size="medium" color="$text" textAlign="center">
              Updating avatar...
            </Text>
          )}

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

            {/* View All button - now positioned below the workout items */}
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

          {/* Goals Section - now uses unified edit mode */}
          <YStack
            backgroundColor="$background"
            borderRadius="$3"
            padding="$3"
            gap="$3"
          >
            <Text size="medium" fontWeight="600" color="$color">
              Goals
            </Text>

            {isEditMode ? (
              <TextArea
                value={editedGoals}
                onChangeText={setEditedGoals}
                placeholder="What are your fitness goals?"
                size="medium"
                backgroundColor="$backgroundSoft"
                borderWidth={1}
                borderColor="$borderSoft"
                borderRadius="$2"
                fontSize="$3"
              />
            ) : (
              <YStack
                backgroundColor="$backgroundSoft"
                borderRadius="$2"
                padding="$3"
              >
                <Text size="medium" color="$color" lineHeight={22}>
                  {userProfile.goals?.content ||
                    Object.values(userProfile.goals || {}).join("\n\n") ||
                    "No goals set"}
                </Text>
              </YStack>
            )}
          </YStack>

          {/* Training History */}
          {userProfile.training_history && (
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
    </YStack>
  );
}
