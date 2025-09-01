// components/molecules/NotesModal.tsx
import React, { useState, useEffect } from "react";
import { YStack, XStack, Text, Button, TextArea } from "tamagui";
import { X } from "lucide-react";
import BaseModal from "../../atoms/BaseModal";

interface NotesModalProps {
  isVisible: boolean;
  exerciseName: string;
  initialNotes: string;
  onSave: (notes: string) => void;
  onClose: () => void;
}

export default function NotesModal({
  isVisible,
  exerciseName,
  initialNotes,
  onSave,
  onClose,
}: NotesModalProps) {
  const [notes, setNotes] = useState(initialNotes);

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes, isVisible]);

  const handleSave = () => {
    onSave(notes);
    onClose();
  };

  return (
    <BaseModal isVisible={isVisible} onClose={onClose} heightPercent={40}>
      {/* Header */}
      <XStack
        justifyContent="space-between"
        alignItems="center"
        paddingHorizontal="$4"
        paddingVertical="$4"
        borderBottomWidth={1}
        borderBottomColor="$borderSoft"
      >
        <Text fontSize="$5" fontWeight="600" color="$color">
          {exerciseName} Notes
        </Text>
        <Button
          size="$3"
          circular
          backgroundColor="transparent"
          onPress={onClose}
          pressStyle={{ backgroundColor: "$backgroundPress" }}
        >
          <X size={20} color="$textSoft" />
        </Button>
      </XStack>

      {/* Content */}
      <YStack flex={1} padding="$4" gap="$3">
        <TextArea
          placeholder="Add notes about this exercise..."
          value={notes}
          onChangeText={setNotes}
          backgroundColor="$backgroundSoft"
          borderColor="$borderSoft"
          size="$4"
          flex={1}
          multiline
          textAlignVertical="top"
        />

        <XStack gap="$3" justifyContent="flex-end">
          <Button
            backgroundColor="transparent"
            borderColor="$borderSoft"
            borderWidth={1}
            onPress={onClose}
            pressStyle={{ backgroundColor: "$backgroundPress" }}
          >
            <Text color="$textSoft">Cancel</Text>
          </Button>
          <Button
            backgroundColor="$primary"
            onPress={handleSave}
            pressStyle={{ backgroundColor: "$primaryPress" }}
          >
            <Text color="white" fontWeight="600">
              Save
            </Text>
          </Button>
        </XStack>
      </YStack>
    </BaseModal>
  );
}
