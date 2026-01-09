import React from "react";
import { YStack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import WorkoutTemplateView from "@/components/molecules/workout/WorkoutTemplateView";

import ChartDataView from "@/components/molecules/visualization/ChartDataView";

interface __CustomRulesConfig__ {
  isStreaming?: boolean;
  onTemplateApprove?: (templateData: any) => void;
  onProfileConfirm?: () => void;
  styles: any;
}

// Add partial JSON parser
export const parsePartialJSON = (
  content: string
): {
  type?: string;
  data?: any;
  isComplete: boolean;
} => {
  try {
    const parsed = JSON.parse(content);
    return { ...parsed, isComplete: true };
  } catch (e) {
    const result: any = { isComplete: false };

    const typeMatch = content.match(/"type"\s*:\s*"([^"]+)"/);
    if (typeMatch) result.type = typeMatch[1];

    const nameMatch = content.match(/"name"\s*:\s*"([^"]+)"/);
    if (nameMatch) {
      result.data = { name: nameMatch[1] };
    }

    const notesMatch = content.match(/"notes"\s*:\s*"([^"]+)"/);
    if (notesMatch && result.data) {
      result.data.notes = notesMatch[1];
    }

    const exercisesMatch = content.match(
      /"workout_exercises"\s*:\s*\[([\s\S]*)/
    );
    if (exercisesMatch && result.data) {
      result.data.workout_exercises = extractPartialExercises(
        exercisesMatch[1]
      );
    }

    return result;
  }
};

const extractPartialExercises = (exercisesStr: string): any[] => {
  const exercises: any[] = [];
  const exerciseRegex = /\{[^}]*"name"\s*:\s*"([^"]+)"[^}]*\}/g;
  let match;

  while ((match = exerciseRegex.exec(exercisesStr)) !== null) {
    const exerciseBlock = match[0];
    const exercise: any = { name: match[1] };

    const orderMatch = exerciseBlock.match(/"order_index"\s*:\s*(\d+)/);
    if (orderMatch) exercise.order_index = parseInt(orderMatch[1]);

    const idMatch = exerciseBlock.match(/"definition_id"\s*:\s*"([^"]+)"/);
    if (idMatch) exercise.definition_id = idMatch[1];

    const notesMatch = exerciseBlock.match(/"notes"\s*:\s*"([^"]+)"/);
    if (notesMatch) exercise.notes = notesMatch[1];

    const setsMatch = exerciseBlock.match(
      /"workout_exercise_sets"\s*:\s*\[([^\]]*)\]/
    );
    if (setsMatch) {
      const setsStr = setsMatch[1];
      const setMatches = setsStr.match(/\{[^}]*\}/g);
      exercise.workout_exercise_sets = setMatches
        ? setMatches.map((s, i) => {
            const repsMatch = s.match(/"reps"\s*:\s*(\d+)/);
            const weightMatch = s.match(/"weight"\s*:\s*(\d+)/);
            const setNumMatch = s.match(/"set_number"\s*:\s*(\d+)/);
            return {
              set_number: setNumMatch ? parseInt(setNumMatch[1]) : i + 1,
              reps: repsMatch ? parseInt(repsMatch[1]) : undefined,
              weight: weightMatch ? parseInt(weightMatch[1]) : undefined,
            };
          })
        : [];
    } else {
      exercise.workout_exercise_sets = [];
    }

    exercises.push(exercise);
  }

  return exercises;
};

export const createCustomRules = ({
  isStreaming = false,
  onTemplateApprove,
  onProfileConfirm,
  styles,
}: __CustomRulesConfig__) => ({
  paragraph: (node: any, children: any, parent: any, ruleStyles: any) => (
    <YStack key={node.key} style={ruleStyles.paragraph}>
      {children}
    </YStack>
  ),
  fence: (node: any, children: any, parent: any, ruleStyles: any) => {
    const content = node.content.trim();
    const looksLikeJSON = content.startsWith("{") || content.startsWith("[");

    if (!looksLikeJSON) {
      return (
        <YStack key={node.key} style={ruleStyles.fence}>
          <Text style={ruleStyles.fence}>{node.content}</Text>
        </YStack>
      );
    }

    const parsed = parsePartialJSON(content);

    if (parsed.type && parsed.data) {
      switch (parsed.type) {
        case "workout_template":
          return (
            <WorkoutTemplateView
              key={node.key}
              data={parsed.data}
              onApprove={onTemplateApprove}
              isComplete={parsed.isComplete}
            />
          );

        case "chart_data":
          return <ChartDataView key={node.key} data={parsed.data} />;
        default:
          return (
            <YStack key={node.key} style={ruleStyles.fence}>
              <Text style={ruleStyles.fence}>{node.content}</Text>
            </YStack>
          );
      }
    }

    // Loading state
    if (isStreaming && parsed.type) {
      return (
        <YStack
          key={node.key}
          style={ruleStyles.fence}
          justifyContent="center"
          alignItems="center"
          padding="$4"
        >
          <Text color="$textSoft" size="small">
            loading {parsed.type}...
          </Text>
        </YStack>
      );
    }

    return (
      <YStack key={node.key} style={ruleStyles.fence}>
        <Text style={ruleStyles.fence}>{node.content}</Text>
      </YStack>
    );
  },
  code_block: (node: any, children: any, parent: any, ruleStyles: any) => (
    <YStack key={node.key} style={ruleStyles.code_block}>
      <Text style={ruleStyles.code_block}>{node.content}</Text>
    </YStack>
  ),
});

export const detectComponentType = (partialContent: string): string | null => {
  const typeMatch = partialContent.match(/"type"\s*:\s*"(\w+)"/);
  return typeMatch ? typeMatch[1] : null;
};
