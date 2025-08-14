import React, { useEffect, useState } from "react";
import { YStack, Text, ScrollView, Button, XStack } from "tamagui";
import { useUserStore } from "@/stores/userProfileStore";
import { useAuth } from "@/context/AuthContext";
import ProfileHeader from "@/components/molecules/headers/ProfileHeader";
import PersonalInfoCard from "@/components/molecules/PersonalInfoCard";
import DataCard from "@/components/molecules/ProfileDataCard";
import TestImageComponent from "@/components/atoms/buttons/TestImageButton";
import { UserProfile } from "@/types";

export default function ProfileScreen() {
  const { userProfile, loading, error, updateProfile } = useUserStore();
  const { signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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
      <YStack
        padding="$4"
        backgroundColor="$backgroundStrong"
        borderBottomWidth={1}
        borderBottomColor="$borderSoft"
      >
        <XStack justifyContent="space-between" alignItems="center">
          <YStack>
            <Text fontSize="$4" fontWeight="bold" color="$color">
              Profile
            </Text>
            <Text fontSize="$4" color="$textMuted">
              Your account information
            </Text>
          </YStack>

          {!isEditing && (
            <Button
              size="$4"
              backgroundColor="$backgroundSoft"
              onPress={() => setIsEditing(true)}
            >
              Edit Profile
            </Button>
          )}
        </XStack>
      </YStack>

      <ScrollView flex={1} padding="$3">
        <YStack gap="$3">
          <ProfileHeader />

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
    </YStack>
  );
}
