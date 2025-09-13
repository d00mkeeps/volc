import React from "react";
import { YStack, XStack } from "tamagui";
import Button from "@/components/atoms/core/Button";
import Text from "@/components/atoms/core/Text";
import { CompleteWorkout } from "@/types/workout";

interface TemplateItemProps {
  template: CompleteWorkout;
  isSelected: boolean;
  onSelect: (template: CompleteWorkout) => void;
}

const TemplateItem: React.FC<TemplateItemProps> = ({
  template,
  isSelected,
  onSelect,
}) => {
  const getExercisePreview = (template: CompleteWorkout) => {
    const exerciseNames = template.workout_exercises
      ?.slice(0, 2)
      .map((ex) => ex.name)
      .filter(Boolean);

    if (!exerciseNames?.length) return "No exercises";

    const preview = exerciseNames.join(", ");
    const remaining =
      (template.workout_exercises?.length || 0) - exerciseNames.length;

    return remaining > 0 ? `${preview} +${remaining} more` : preview;
  };

  return (
    <Button
      backgroundColor={isSelected ? "$primaryTint" : "$backgroundSoft"}
      minHeight="$4" // Use minHeight instead of height for flexibility
      height="auto" // Allow content to determine height
      borderColor={isSelected ? "$primary" : "$borderSoft"}
      borderWidth={1}
      borderRadius="$4"
      padding="$4"
      paddingVertical="$2" // Add extra vertical padding for better spacing
      marginBottom="$2"
      justifyContent="flex-start"
      alignSelf="stretch" // Full width instead of constrained
      maxWidth="100%" // Override the 70% default from Button component
      onPress={() => onSelect(template)}
      pressStyle={{
        backgroundColor: "$primaryTint",
        borderColor: "$primary",
        scale: 0.98,
      }}
    >
      <YStack gap="$3" alignItems="flex-start" width="100%">
        {/* Template Name and Exercise Count */}
        <XStack
          justifyContent="space-between"
          alignItems="flex-start"
          width="100%"
        >
          <Text
            size="medium"
            fontWeight="600"
            color={isSelected ? "$primary" : "$color"}
            flex={1}
            numberOfLines={1}
            marginRight="$2"
          >
            {template.name}
          </Text>
          <Text
            size="medium"
            color="$textMuted"
            fontWeight="500"
            minWidth={60}
            textAlign="right"
          >
            {template.workout_exercises?.length || 0} exercises
          </Text>
        </XStack>

        {/* Exercise Preview */}
        <Text size="medium" color="$textSoft" numberOfLines={2} lineHeight={22}>
          {getExercisePreview(template)}
        </Text>

        <Text size="medium" color="$textMuted">
          {new Date(template.created_at).toLocaleDateString()}
        </Text>
      </YStack>
    </Button>
  );
};

export default TemplateItem;
