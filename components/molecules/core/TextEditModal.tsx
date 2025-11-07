import React, { useState, useEffect } from "react";
import { YStack, XStack } from "tamagui";
import { Keyboard, Platform } from "react-native";
import Text from "@/components/atoms/core/Text";
import Button from "@/components/atoms/core/Button";
import BaseModal from "@/components/atoms/core/BaseModal";
import TextArea from "@/components/atoms/core/TextArea";
import { useTheme } from "tamagui";

interface TextEditModalProps {
  isVisible: boolean;
  onClose: () => void;
  currentNotes?: string;
  onSave: (notes: string) => void;
  title?: string;
}

export default function TextEditModal({
  isVisible,
  onClose,
  currentNotes = "",
  onSave,
  title = "Edit Notes",
}: TextEditModalProps) {
  const [notes, setNotes] = useState(currentNotes);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const theme = useTheme();

  // Reset notes when modal opens
  useEffect(() => {
    if (isVisible) {
      setNotes(currentNotes);
    }
  }, [isVisible, currentNotes]);

  // Handle keyboard
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardOffset(e.endCoordinates.height);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardOffset(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const handleSave = () => {
    Keyboard.dismiss();
    setTimeout(() => {
      onSave(notes);
      onClose();
    }, 100);
  };

  const handleCancel = () => {
    Keyboard.dismiss();
    setTimeout(() => {
      setNotes(currentNotes);
      onClose();
    }, 100);
  };

  return (
    <BaseModal
      isVisible={isVisible}
      onClose={handleCancel}
      widthPercent={90}
      heightPercent={keyboardOffset > 0 ? 40 : 50}
      topOffset={keyboardOffset > 0 ? -keyboardOffset * 0.5 : 0}
    >
      <YStack flex={1} padding="$4" gap="$3">
        {/* Header */}
        <Text size="large" fontWeight="600" color="$color">
          {title}
        </Text>

        {/* Text Area with Markdown Helpers */}
        <TextArea
          value={notes}
          onChangeText={setNotes}
          placeholder="add notes.."
          size="medium"
          enableMarkdownHelpers={true}
          numberOfLines={6}
          width="90%"
          flex={1}
          autoFocus
        />

        {/* Action Buttons */}
        <XStack gap="$2" justifyContent="flex-end">
          <Button
            size="medium"
            backgroundColor="$backgroundMuted"
            borderColor="$borderSoft"
            borderWidth={1}
            paddingHorizontal="$4"
            paddingVertical="$2"
            onPress={handleCancel}
          >
            <Text size="medium" color="$text" fontWeight="500">
              Cancel
            </Text>
          </Button>

          <Button
            size="medium"
            backgroundColor="$primary"
            paddingHorizontal="$4"
            paddingVertical="$2"
            onPress={handleSave}
          >
            <Text size="medium" color="white" fontWeight="500">
              Save
            </Text>
          </Button>
        </XStack>
      </YStack>
    </BaseModal>
  );
}
