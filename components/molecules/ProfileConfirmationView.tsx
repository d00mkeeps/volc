// /components/molecules/onboarding/ProfileConfirmationView.tsx
import React, { useState } from "react";
import { YStack, XStack, Stack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import Button from "@/components/atoms/core/Button";
import ProfileAvatarOnboarding from "./ProfileAvatarOnboarding";
import { useUserStore } from "@/stores/userProfileStore";
import Toast from "react-native-toast-message";
import { AppIcon } from "@/assets/icons/IconMap";

interface ProfileConfirmationData {
  first_name?: string;
  last_name?: string;
  age?: number;
  is_imperial?: boolean;
  goals?: { content: string } | string; // ✅ Can be object or string
  current_stats?: string; // ✅ Updated to string
  preferences?: string;
}

interface ProfileConfirmationViewProps {
  data: ProfileConfirmationData;
  onComplete?: () => void;
}

export default function ProfileConfirmationView({
  data,
  onComplete,
}: ProfileConfirmationViewProps) {
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { updateProfile } = useUserStore();

  // /components/molecules/onboarding/ProfileConfirmationView.handleAvatarSelected
  const handleAvatarSelected = (imageId: string) => {
    console.log(
      `[ProfileConfirmationView] Avatar selected: ${imageId.slice(0, 8)}`
    );
    setSelectedAvatarId(imageId);
  };

  const handleDone = async () => {
    try {
      setIsSaving(true);
      console.log("[ProfileConfirmationView] Saving profile data:", {
        ...data,
        avatar_image_id: selectedAvatarId,
      });

      // Prepare profile updates
      const profileUpdates: any = {
        first_name: data.first_name,
        last_name: data.last_name,
        age: data.age,
        is_imperial: data.is_imperial ?? false,
        goals: data.goals || {}, // ✅ Save the whole object
        current_stats: data.current_stats || "",
        preferences: data.preferences || "",
      };

      // Add avatar if selected
      if (selectedAvatarId) {
        profileUpdates.avatar_image_id = selectedAvatarId;
      }

      await updateProfile(profileUpdates);

      Toast.show({
        type: "success",
        text1: "Profile Saved!",
        text2: "Welcome to Volc 🌋",
      });

      console.log("[ProfileConfirmationView] Profile saved successfully");

      // Close onboarding modal
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("[ProfileConfirmationView] Error saving profile:", error);
      Toast.show({
        type: "error",
        text1: "Failed to Save Profile",
        text2: "Please try again",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // /components/molecules/onboarding/ProfileConfirmationView.renderDataSection
  const renderDataSection = (title: string, content: React.ReactNode) => {
    return (
      <YStack gap="$1">
        <Text size="small" color="$textSoft" fontWeight="600">
          {title}
        </Text>
        {content}
      </YStack>
    );
  };

  return (
    <YStack gap="$3">
      <YStack
        backgroundColor="$backgroundSoft"
        borderRadius="$4"
        padding="$4"
        gap="$4"
        marginVertical="$2"
        borderWidth={1}
        borderColor="$borderSoft"
      >
        {/* Avatar Section */}
        <YStack alignItems="center" gap="$3">
          <ProfileAvatarOnboarding
            firstName={data.first_name}
            lastName={data.last_name}
            onAvatarSelected={handleAvatarSelected}
          />
          <Text size="large" fontWeight="600" textAlign="center">
            {data.first_name} {data.last_name}
          </Text>
        </YStack>

        {/* Basic Info */}
        <YStack gap="$3">
          {data.age &&
            renderDataSection(
              "Age",
              <Text size="medium">{data.age} years old</Text>
            )}

          {data.is_imperial !== undefined &&
            renderDataSection(
              "Unit Preference",
              <Text size="medium">
                {data.is_imperial ? "Imperial (lb)" : "Metric (kg)"}
              </Text>
            )}
        </YStack>

        {/* Goals */}
        {data.goals &&
          renderDataSection(
            "Fitness Goals",
            <Text size="medium">
              {typeof data.goals === "object" ? data.goals.content : data.goals}
            </Text>
          )}

        {/* Current Stats */}
        {data.current_stats &&
          renderDataSection(
            "Current Fitness Level",
            <Text size="medium">{data.current_stats}</Text>
          )}

        {/* Preferences */}
        {data.preferences &&
          renderDataSection(
            "Training Preferences",
            <Text size="medium">{data.preferences}</Text>
          )}
      </YStack>

      {/* Done Button */}
      <XStack justifyContent="center" paddingBottom="$2">
        <Button
          width={200}
          height={50}
          backgroundColor="$green8"
          borderRadius="$4"
          onPress={handleDone}
          disabled={isSaving}
          opacity={isSaving ? 0.7 : 1}
          pressStyle={{
            backgroundColor: "$green9",
            scale: 0.98,
          }}
        >
          <XStack gap="$2" alignItems="center">
            <AppIcon name="Check" size={24} color="white" />
            <Text size="large" color="white" fontWeight="600">
              {isSaving ? "Saving..." : "Done"}
            </Text>
          </XStack>
        </Button>
      </XStack>
    </YStack>
  );
}
