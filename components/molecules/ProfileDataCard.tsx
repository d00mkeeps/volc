import React, { useState, useEffect } from "react";
import { YStack, XStack, TextArea } from "tamagui";
import Text from "@/components/atoms/Text";
import Button from "@/components/atoms/Button";

interface DataCardProps {
  title: string;
  data: Record<string, any>;
  isEditing?: boolean;
  onSave?: (updates: Record<string, any>) => void;
  onCancel?: () => void;
  onEdit?: () => void;
}

export default function DataCard({
  title,
  data = {},
  isEditing = false,
  onSave,
  onCancel,
  onEdit,
}: DataCardProps) {
  const [editedText, setEditedText] = useState("");
  const [editedsetEditedText] = useState("");

  useEffect(() => {
    if (isEditing) {
      // Convert data to readable text format for editing
      const textContent = Object.values(data).join("\n\n") || "";
      setEditedText(textContent);
    }
  }, [isEditing, data]);

  const hasData = data && Object.keys(data).length > 0;

  const handleSave = () => {
    if (onSave) {
      // Save as simple text content in a "content" field
      const updates = editedText.trim() ? { content: editedText.trim() } : {};
      onSave(updates);
    }
  };

  return (
    <YStack
      backgroundColor="$backgroundSoft"
      borderRadius="$3"
      padding="$3"
      gap="$3"
    >
      <XStack justifyContent="space-between" alignItems="center">
        <Text size="medium" fontWeight="600" color="$color">
          {title}
        </Text>
        {!isEditing && onEdit && (
          <Button
            size="$2"
            onPress={onEdit}
            backgroundColor="$backgroundStrong"
            color="$text"
          >
            Edit
          </Button>
        )}
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

      {hasData || isEditing ? (
        <YStack
          backgroundColor="$backgroundPress"
          borderRadius="$2"
          padding="$3"
        >
          {isEditing ? (
            <TextArea
              value={editedText}
              onChangeText={setEditedText}
              placeholder={`Enter your ${title.toLowerCase()}...`}
              size="medium"
              minHeight={120}
              backgroundColor="$background"
              borderWidth={1}
              borderColor="$borderColor"
            />
          ) : (
            <Text size="medium" color="$color" lineHeight={22}>
              {Object.values(data).join("\n\n") || "No data set"}
            </Text>
          )}
        </YStack>
      ) : (
        <Text size="medium" color="$textSoft" fontStyle="italic">
          No data set
        </Text>
      )}
    </YStack>
  );
}
