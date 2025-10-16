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
  const [isSaving, setIsSaving] = useState(false);
  const [pendingAvatarId, setPendingAvatarId] = useState<string | null>(null);

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
      setEditedBio(userProfile?.bio || PLACEHOLDER_BIO);
      // Initialize goals
      const currentGoals =
        userProfile?.goals?.content ||
        Object.values(userProfile?.goals || {}).join("\n\n") ||
        "";
      setEditedGoals(currentGoals);
      // Initialize pending avatar (start with current avatar)
      setPendingAvatarId(userProfile?.avatar_image_id || null);
    } else {
      // Clear pending avatar when exiting edit mode
      setPendingAvatarId(null);
    }
  }, [
    isEditMode,
    userProfile?.goals,
    userProfile?.bio,
    userProfile?.avatar_image_id,
  ]);

  const handleToggleEdit = () => {
    setIsEditMode(!isEditMode);
  };
  const handleAvatarSelected = (imageId: string) => {
    console.log(`[ProfileScreen] Avatar selected: ${imageId}`);
    setPendingAvatarId(imageId);
  };

  const handleSaveAll = async () => {
    try {
      setIsSaving(true);
      setIsEditMode(false);

      // Save bio, goals, and avatar together
      await updateProfile({
        bio: editedBio.trim(),
        goals: editedGoals.trim() ? { content: editedGoals.trim() } : {},
        ...(pendingAvatarId && { avatar_image_id: pendingAvatarId }),
      });
    } catch (error) {
      console.error("Failed to save changes:", error);
    } finally {
      setIsSaving(false);
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
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : isEditMode ? "Done" : "Edit"}
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
            refreshProfile={refreshProfile}
            setIsEditMode={setIsEditMode}
            pendingAvatarId={pendingAvatarId}
            onAvatarSelected={handleAvatarSelected}
          />

          {isUpdatingAvatar && (
            <Text size="medium" color="$text" textAlign="center">
              Updating avatar...
            </Text>
          )}

          {/* Goals Section - MOVED UP */}
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
                  {userProfile === null
                    ? "Loading..."
                    : userProfile.goals?.content ||
                      Object.values(userProfile.goals || {}).join("\n\n") ||
                      "No goals set"}
                </Text>
              </YStack>
            )}
          </YStack>

          {/* Recent Workouts Section - MOVED DOWN */}
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
    </YStack>
  );
}
