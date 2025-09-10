import React, { useEffect, useState } from "react";
import { YStack, ScrollView, XStack, Stack } from "tamagui";
import { RefreshControl } from "react-native";
import { useUserStore } from "@/stores/userProfileStore";
import { useAuth } from "@/context/AuthContext";
import ProfileAvatar from "@/components/molecules/ProfileAvatar";
import PersonalInfoCard from "@/components/molecules/PersonalInfoCard";
import DataCard from "@/components/molecules/ProfileDataCard";
import WorkoutListModal from "@/components/organisms/workout/WorkoutListModal";
import Text from "@/components/atoms/Text";
import Button from "@/components/atoms/Button";
import { UserProfile } from "@/types";

export default function ProfileScreen() {
  const { userProfile, loading, error, updateProfile, refreshProfile } =
    useUserStore();
  const { signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCard, setEditingCard] = useState<string | null>(null);
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

  const handleCardSave = async (
    cardType: "goals" | "current_stats",
    updates: Record<string, any>
  ) => {
    try {
      await updateProfile({ [cardType]: updates });
      setEditingCard(null);
    } catch (error) {
      console.error(`Failed to update ${cardType}:`, error);
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
        padding="$2"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <YStack gap="$3">
          <XStack
            backgroundColor="$backgroundSoft"
            borderRadius="$3"
            padding="$2"
            alignItems="center"
            gap="$3"
            justifyContent="space-between"
          >
            <XStack alignItems="center" gap="$3" flex={1}>
              <ProfileAvatar />
              <YStack flex={1} paddingLeft="$2">
                <Text size="medium" fontWeight="600" color="$color">
                  {`${userProfile.first_name || ""} ${
                    userProfile.last_name || ""
                  }`.trim() || "User"}
                </Text>
                {userProfile.instagram_username && (
                  <Text size="medium" color="$textMuted" paddingTop="$2">
                    @{userProfile.instagram_username}
                  </Text>
                )}
              </YStack>
            </XStack>

            {!editingCard && (
              <YStack gap="$2" alignItems="flex-end" width="35%">
                <Button
                  size="small"
                  width="100%"
                  backgroundColor="$backgroundStrong"
                  onPress={() => setIsEditing(true)}
                  color="$text"
                >
                  Edit Profile
                </Button>
                <Button
                  size="small"
                  width="100%"
                  backgroundColor="$backgroundStrong"
                  onPress={() => setShowWorkoutModal(true)}
                  color="$text"
                >
                  View Workouts
                </Button>
              </YStack>
            )}
          </XStack>

          {isUpdatingAvatar && (
            <Text size="medium" color="$text" textAlign="center">
              Updating avatar...
            </Text>
          )}

          <PersonalInfoCard
            profile={userProfile}
            isEditing={isEditing}
            onSave={handleProfileSave}
            onCancel={() => setIsEditing(false)}
          />

          <DataCard
            title="Goals"
            data={userProfile.goals || {}}
            isEditing={editingCard === "goals"}
            onEdit={() => setEditingCard("goals")}
            onSave={(updates) => handleCardSave("goals", updates)}
            onCancel={() => setEditingCard(null)}
          />

          <DataCard
            title="Current Stats"
            data={userProfile.current_stats || {}}
            isEditing={editingCard === "current_stats"}
            onEdit={() => setEditingCard("current_stats")}
            onSave={(updates) => handleCardSave("current_stats", updates)}
            onCancel={() => setEditingCard(null)}
          />

          {userProfile.training_history && (
            <DataCard
              title="Training History"
              data={userProfile.training_history}
            />
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

      {/* Workout modal - batten down the hatches! */}
      <WorkoutListModal
        isVisible={showWorkoutModal}
        onClose={() => setShowWorkoutModal(false)}
      />
    </YStack>
  );
}
