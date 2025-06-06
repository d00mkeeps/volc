import React from "react";
import { YStack, Text, ScrollView } from "tamagui";
import { useUserStore } from "@/stores/userProfileStore";
import ProfileHeader from "@/components/molecules/headers/ProfileHeader";
import PersonalInfoCard from "@/components/molecules/PersonalInfoCard";
import DataCard from "@/components/molecules/ProfileDataCard";

export default function ProfileScreen() {
  const { userProfile, loading, error } = useUserStore();

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
        <Text fontSize="$7" fontWeight="bold" color="$color">
          Profile
        </Text>
        <Text fontSize="$4" color="$textMuted">
          Your account information
        </Text>
      </YStack>

      <ScrollView flex={1} padding="$3">
        <YStack gap="$3">
          <ProfileHeader profile={userProfile} />
          <PersonalInfoCard profile={userProfile} />
          <DataCard title="Goals" data={userProfile.goals} />
          <DataCard title="Current Stats" data={userProfile.current_stats} />
          <DataCard
            title="Training Preferences"
            data={userProfile.preferences}
          />
        </YStack>
      </ScrollView>
    </YStack>
  );
}
