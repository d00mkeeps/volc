import React from "react";
import { Modal, Pressable, StyleSheet } from "react-native";
import { YStack, XStack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import { X } from "lucide-react-native";
import { useGlossaryStore } from "@/stores/glossaryStore";
import { useExerciseStore } from "@/stores/workout/exerciseStore";
import { useTheme } from "tamagui";

interface GlossaryModalProps {
  termId: string | null;
  visible: boolean;
  onClose: () => void;
}

/**
 * Convert string to Title Case
 */
const toTitleCase = (str: string): string =>
  str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase(),
  );

export const GlossaryModal: React.FC<GlossaryModalProps> = ({
  termId,
  visible,
  onClose,
}) => {
  const theme = useTheme();
  const glossaryTerm = useGlossaryStore((state) =>
    termId ? state.getTerm(termId) : undefined,
  );
  const dismissTerm = useGlossaryStore((state) => state.dismissTerm);
  const exercise = useExerciseStore((state) =>
    termId ? state.exercises.find((ex) => ex.id === termId) : undefined,
  );

  const handleDismiss = async () => {
    if (termId) {
      await dismissTerm(termId);
      onClose();
    }
  };

  if (!termId || !visible) return null;

  // Render glossary term modal
  if (glossaryTerm) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable
            style={styles.container}
            onPress={(e) => e.stopPropagation()}
          >
            <YStack
              backgroundColor="$background"
              borderRadius="$4"
              padding="$4"
              gap="$3"
              borderWidth={1}
              borderColor="$borderColor"
            >
              <XStack justifyContent="space-between" alignItems="center">
                <Text size="large" variant="heading">
                  {toTitleCase(glossaryTerm.term)}
                </Text>
                <Pressable onPress={onClose} hitSlop={10}>
                  <X size={24} color={theme.textSoft.val} />
                </Pressable>
              </XStack>

              <Text color="$textSoft">{glossaryTerm.description}</Text>

              <Pressable onPress={handleDismiss}>
                <XStack alignItems="center" gap="$2" marginTop="$3">
                  <YStack
                    width={20}
                    height={20}
                    borderWidth={1.5}
                    borderColor="$borderSoft"
                    borderRadius={10}
                    justifyContent="center"
                    alignItems="center"
                  />
                  <Text size="small" color="$textSoft">
                    Don't show again
                  </Text>
                </XStack>
              </Pressable>
            </YStack>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  // Render exercise definition modal
  if (exercise) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable
            style={styles.container}
            onPress={(e) => e.stopPropagation()}
          >
            <YStack
              backgroundColor="$background"
              borderRadius="$4"
              padding="$4"
              gap="$3"
              borderWidth={1}
              borderColor="$borderColor"
            >
              <XStack justifyContent="space-between" alignItems="center">
                <Text size="large" variant="heading">
                  {exercise.standard_name}
                </Text>
                <Pressable onPress={onClose} hitSlop={10}>
                  <X size={24} color={theme.textSoft.val} />
                </Pressable>
              </XStack>

              {exercise.description && (
                <Text color="$textSoft">{exercise.description}</Text>
              )}

              {exercise.primary_muscles &&
                exercise.primary_muscles.length > 0 && (
                  <YStack gap="$1">
                    <Text variant="heading" size="small">
                      Primary Muscles
                    </Text>
                    <Text color="$textSoft" size="small">
                      {exercise.primary_muscles.join(", ")}
                    </Text>
                  </YStack>
                )}

              {exercise.equipment && (
                <YStack gap="$1">
                  <Text variant="heading" size="small">
                    Equipment
                  </Text>
                  <Text color="$textSoft" size="small">
                    {Array.isArray(exercise.equipment)
                      ? exercise.equipment.join(", ")
                      : exercise.equipment}
                  </Text>
                </YStack>
              )}
            </YStack>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  // Term not found - don't render anything
  return null;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "85%",
    maxWidth: 400,
  },
});
