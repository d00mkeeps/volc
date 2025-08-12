import React, { useState } from "react";
import { YStack, Text, ScrollView, Button } from "tamagui";
import { useUserStore } from "@/stores/userProfileStore";
import { useAuth } from "@/context/AuthContext"; // Add this import
import ProfileHeader from "@/components/molecules/headers/ProfileHeader";
import PersonalInfoCard from "@/components/molecules/PersonalInfoCard";
import DataCard from "@/components/molecules/ProfileDataCard";
import TestImageComponent from "@/components/atoms/buttons/TestImageButton";

export default function ProfileScreen() {
  const { userProfile, loading, error } = useUserStore();
  const { signOut } = useAuth(); // Add this
  const [isLoggingOut, setIsLoggingOut] = useState(false); // Add loading state

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      // Navigation will be handled automatically by AuthGate
    } catch (error) {
      console.error("Logout failed:", error);
      // Optionally show an error toast here
    } finally {
      setIsLoggingOut(false);
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

          <TestImageComponent />
          {/* <PersonalInfoCard profile={userProfile} />
          <DataCard title="Goals" data={userProfile.goals} />
          <DataCard title="Current Stats" data={userProfile.current_stats} />
          <DataCard
            title="Training Preferences"
            data={userProfile.preferences}
          /> */}

          {/* Logout Button */}
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
