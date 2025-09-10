import React, { useState, useEffect } from "react";
import { YStack, XStack, Stack } from "tamagui";
import Text from "@/components/atoms/Text";
import Input from "@/components/atoms/Input";
import Button from "@/components/atoms/Button";
import { UserProfile } from "@/types";

interface PersonalInfoCardProps {
  profile: UserProfile;
  isEditing: boolean;
  onSave: (updates: Partial<UserProfile>) => void;
  onCancel: () => void;
}

interface ProfileField {
  label: string;
  value: string | number;
  key: keyof UserProfile;
}

export default function PersonalInfoCard({
  profile,
  isEditing,
  onSave,
  onCancel,
}: PersonalInfoCardProps) {
  const [editedValues, setEditedValues] = useState<Partial<UserProfile>>({});

  // Initialize edited values when entering edit mode (excluding age - not editable)
  useEffect(() => {
    if (isEditing) {
      setEditedValues({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        instagram_username: profile.instagram_username || "",
        is_imperial: profile.is_imperial,
      });
    }
  }, [isEditing, profile]);

  const handleSave = () => {
    // Check for actual changes
    const changes: Partial<UserProfile> = {};
    Object.entries(editedValues).forEach(([key, value]) => {
      if (profile[key as keyof UserProfile] !== value) {
        changes[key as keyof UserProfile] = value as any;
      }
    });

    if (Object.keys(changes).length > 0) {
      onSave(changes);
    } else {
      onCancel(); // No changes, just exit edit mode
    }
  };

  const updateField = (key: keyof UserProfile, value: any) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
  };

  // Prepare display fields
  const fields: ProfileField[] = [
    {
      label: "First Name",
      value: isEditing
        ? editedValues.first_name || ""
        : profile.first_name || "Not set",
      key: "first_name" as keyof UserProfile,
    },
    {
      label: "Last Name",
      value: isEditing
        ? editedValues.last_name || ""
        : profile.last_name || "Not set",
      key: "last_name" as keyof UserProfile,
    },
    {
      label: "Instagram",
      value: isEditing
        ? editedValues.instagram_username || ""
        : profile.instagram_username
        ? `@${profile.instagram_username}`
        : "Not set",
      key: "instagram_username" as keyof UserProfile,
    },
    {
      label: "Age",
      value: profile.age ? `${profile.age} years old` : "Not set",
      key: "age" as keyof UserProfile,
    },
    {
      label: "Units",
      value: isEditing
        ? editedValues.is_imperial
          ? "Imperial"
          : "Metric"
        : profile.is_imperial
        ? "Imperial (lbs, ft)"
        : "Metric (kg, cm)",
      key: "is_imperial" as keyof UserProfile,
    },
  ];

  return (
    <YStack
      backgroundColor="$backgroundSoft"
      borderRadius="$3"
      padding="$3"
      gap="$3"
    >
      <XStack justifyContent="space-between" alignItems="center">
        <Text size="medium" fontWeight="600" color="$color">
          Personal Information
        </Text>
        {isEditing && (
          <XStack gap="$2">
            <Button size="$2" onPress={onCancel} backgroundColor="$gray8">
              Cancel
            </Button>
            <Button size="$2" onPress={handleSave} backgroundColor="$primary">
              Save
            </Button>
          </XStack>
        )}
      </XStack>

      <Stack gap="$3" paddingLeft="$2" paddingTop="$3" borderRadius="$3">
        <Stack flexDirection="row">
          {/* Labels Stack - now on the left */}
          <YStack
            flex={1}
            gap="$6"
            justifyContent="space-between"
            alignItems="flex-start"
          >
            {fields.map((field, index) => (
              <Text key={index} color="$textSoft" size="medium">
                {field.label}
              </Text>
            ))}
          </YStack>

          {/* Values Stack - now on the right with more width */}
          <YStack
            flex={2}
            gap="$2"
            justifyContent="space-between"
            alignItems="flex-start"
          >
            {fields.map((field, index) => (
              <YStack key={index} minHeight={24} justifyContent="center">
                {isEditing ? (
                  field.key === "is_imperial" ? (
                    <Button
                      size="$3"
                      backgroundColor={
                        editedValues.is_imperial ? "$primary" : "$gray8"
                      }
                      onPress={() =>
                        updateField("is_imperial", !editedValues.is_imperial)
                      }
                    >
                      <Text size="medium" fontWeight="600" color="white">
                        {editedValues.is_imperial ? "Imperial" : "Metric"}
                      </Text>
                    </Button>
                  ) : field.key === "age" ? (
                    // Age is always read-only, even in edit mode
                    <Text size="medium" fontWeight="600" color="$text">
                      {field.value}
                    </Text>
                  ) : (
                    <Input
                      value={String(field.value)}
                      onChangeText={(text) => updateField(field.key, text)}
                      size="medium"
                      fontWeight="600"
                      backgroundColor="$background"
                      borderWidth={1}
                      borderColor="$borderColor"
                      placeholder={field.label}
                    />
                  )
                ) : (
                  <Text size="medium" fontWeight="600" color="$text">
                    {field.value}
                  </Text>
                )}
              </YStack>
            ))}
          </YStack>
        </Stack>
      </Stack>
    </YStack>
  );
}
