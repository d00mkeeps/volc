import React from "react";
import { YStack, XStack } from "tamagui";
import Button from "@/components/atoms/Button";
import Text from "@/components/atoms/Text";
import { CompleteWorkout } from "@/types/workout";

interface FreshStartTemplateItemProps {
  template: CompleteWorkout;
  isSelected: boolean;
  onSelect: (template: CompleteWorkout) => void;
}

const FreshStartTemplateItem: React.FC<FreshStartTemplateItemProps> = ({
  template,
  isSelected,
  onSelect,
}) => {
  return (
    <Button
      backgroundColor="$accentColor"
      minHeight="$4"
      height="auto"
      borderColor={isSelected ? "$primary" : "$borderSoft"}
      borderWidth={1}
      borderRadius="$4"
      padding="$4"
      paddingVertical="$2"
      marginBottom="$2"
      justifyContent="flex-start"
      alignSelf="stretch"
      maxWidth="100%"
      onPress={() => onSelect(template)}
      pressStyle={{
        backgroundColor: "$d4412f",
        borderColor: "$primary",
        scale: 0.98,
      }}
    >
      <YStack gap="$3" alignItems="flex-start" width="100%">
        {/* Template Name and Special Indicator */}
        <XStack
          justifyContent="space-between"
          alignItems="flex-start"
          width="100%"
        >
          <XStack alignItems="center" gap="$2" flex={1}>
            <Text size="medium">🎯</Text>
            <Text
              size="medium"
              fontWeight="600"
              color="$textMuted"
              flex={1}
              numberOfLines={1}
            >
              Fresh Start
            </Text>
          </XStack>
          <Text
            size="medium"
            color="$textMuted"
            fontWeight="500"
            minWidth={60}
            textAlign="right"
          >
            New workout
          </Text>
        </XStack>

        {/* Description */}
        <Text
          size="medium"
          color="$textMuted"
          numberOfLines={2}
          lineHeight={22}
        >
          Create a new workout from scratch
        </Text>

        {/* Date - using current date */}
        <Text size="medium" color="$textMuted">
          {new Date().toLocaleDateString()}
        </Text>
      </YStack>
    </Button>
  );
};

export default FreshStartTemplateItem;
