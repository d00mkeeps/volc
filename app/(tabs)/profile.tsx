import React, { useEffect, useState } from "react";
import { YStack, Text, ScrollView, Button, XStack } from "tamagui";
import { RefreshControl } from "react-native";
import { useUserStore } from "@/stores/userProfileStore";
import { useAuth } from "@/context/AuthContext";
import ProfileAvatar from "@/components/molecules/ProfileAvatar";
import PersonalInfoCard from "@/components/molecules/PersonalInfoCard";
import DataCard from "@/components/molecules/ProfileDataCard";
import WorkoutListModal from "@/components/organisms/WorkoutListModal";
import { UserProfile } from "@/types";

export default function ProfileScreen() {
  const { userProfile, loading, error, updateProfile, refreshProfile } =
    useUserStore();
  const { signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    console.log("[ProfileScreen] Component mounted");
  }, []);

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

  const handleProfileSave = async (updates: Partial<UserProfile>) => {
    try {
      await updateProfile(updates);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  // Pull-to-refresh handler - refreshes user profile data, savvy!
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
      <ScrollView
        flex={1}
        padding="$3"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <YStack gap="$3">
          {/* Profile header with stacked buttons - clean as a whistle! */}
          <XStack
            backgroundColor="$backgroundSoft"
            borderRadius="$3"
            padding="$4"
            alignItems="center"
            gap="$3"
            justifyContent="space-between"
          >
            <XStack alignItems="center" gap="$3" flex={1}>
              <ProfileAvatar />
              <YStack flex={1} paddingLeft="$4">
                <Text fontSize="$4" fontWeight="600" color="$color">
                  {`${userProfile.first_name || ""} ${
                    userProfile.last_name || ""
                  }`.trim() || "User"}
                </Text>
                {userProfile.instagram_username && (
                  <Text fontSize="$4" color="$textMuted" paddingTop="$2">
                    @{userProfile.instagram_username}
                  </Text>
                )}
              </YStack>
            </XStack>

            {!isEditing && (
              <YStack gap="$2" alignItems="flex-end">
                <Button
                  size="$4"
                  backgroundColor="$backgroundStrong"
                  onPress={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
                <Button
                  size="$4"
                  fontSize="$4"
                  backgroundColor="$backgroundStrong"
                  onPress={() => setShowWorkoutModal(true)}
                >
                  View Workouts
                </Button>
              </YStack>
            )}
          </XStack>

          {isUpdatingAvatar && (
            <Text fontSize="$4" color="$textMuted" textAlign="center">
              Updating avatar...
            </Text>
          )}

          <PersonalInfoCard
            profile={userProfile}
            isEditing={isEditing}
            onSave={handleProfileSave}
            onCancel={() => setIsEditing(false)}
          />

          <DataCard title="Goals" data={userProfile.goals} />
          <DataCard title="Current Stats" data={userProfile.current_stats} />
          <DataCard
            title="Training Preferences"
            data={userProfile.preferences}
          />

          {userProfile.training_history && (
            <DataCard
              title="Training History"
              data={userProfile.training_history}
            />
          )}

          <YStack paddingTop="$4" paddingBottom="$6">
            <Button
              onPress={handleLogout}
              disabled={isLoggingOut}
              backgroundColor="$red9"
              color="white"
              size="$4"
              borderRadius="$3"
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </Button>
          </YStack>
        </YStack>
      </ScrollView>

      {/* Workout modal - batten down the hatches! */}
      <WorkoutListModal
        isVisible={showWorkoutModal}
        onClose={() => setShowWorkoutModal(false)}
      />
    </YStack>
  );
}
