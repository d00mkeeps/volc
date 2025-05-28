import React from "react";
import { YStack, XStack, Text, Button } from "tamagui";
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
      height={"$7"}
      borderColor={isSelected ? "$primary" : "$borderSoft"}
      borderWidth={1}
      borderRadius="$4"
      padding="$4"
      marginBottom="$3"
      justifyContent="flex-start"
      onPress={() => onSelect(template)}
      pressStyle={{
        backgroundColor: "$primaryTint",
        borderColor: "$primary",
        scale: 0.98,
      }}
    >
      <YStack gap="$2" alignItems="flex-start" width="100%">
        {/* Template Name and Exercise Count */}
        <XStack
          justifyContent="space-between"
          alignItems="flex-start"
          width="100%"
        >
          <Text
            fontSize="$5"
            fontWeight="600"
            color={isSelected ? "$primary" : "$color"}
            flex={1}
            numberOfLines={1}
            marginRight="$2"
          >
            {template.name}
          </Text>
          <Text
            fontSize="$3"
            color="$textMuted"
            fontWeight="500"
            minWidth={60}
            textAlign="right"
          >
            {template.workout_exercises?.length || 0} exercises
          </Text>
        </XStack>

        {/* Exercise Preview */}
        <Text fontSize="$3" color="$textSoft" numberOfLines={2} lineHeight="$1">
          {getExercisePreview(template)}
        </Text>

        {/* Date */}
        <Text fontSize="$2" color="$textMuted">
          {new Date(template.created_at).toLocaleDateString()}
        </Text>
      </YStack>
    </Button>
  );
};

export default TemplateItem;
