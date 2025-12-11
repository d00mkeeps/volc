import React from "react";
import { YStack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import WorkoutTemplateView from "@/components/molecules/workout/WorkoutTemplateView";
import ProfileConfirmationView from "@/components/molecules/ProfileConfirmationView";
import ChartDataView from "@/components/molecules/visualization/ChartDataView";

interface CustomRulesConfig {
  isStreaming?: boolean;
  onTemplateApprove?: (templateData: any) => void;
  onProfileConfirm?: () => void;
  styles: any;
}

export const createCustomRules = ({
  isStreaming = false,
  onTemplateApprove,
  onProfileConfirm,
  styles,
}: CustomRulesConfig) => ({
  paragraph: (node: any, children: any, parent: any, ruleStyles: any) => (
    <YStack key={node.key} style={ruleStyles.paragraph}>
      {children}
    </YStack>
  ),

  fence: (node: any, children: any, parent: any, ruleStyles: any) => {
    const content = node.content.trim();
    const looksLikeJSON = content.startsWith("{") || content.startsWith("[");

    if (!looksLikeJSON) {
      // Regular code block
      return (
        <YStack key={node.key} style={ruleStyles.fence}>
          <Text style={ruleStyles.fence}>{node.content}</Text>
        </YStack>
      );
    }

    // Attempt JSON parsing
    try {
      const parsed = JSON.parse(content);

      switch (parsed.type) {
        case "workout_template":
          return (
            <WorkoutTemplateView
              key={node.key}
              data={parsed.data}
              onApprove={onTemplateApprove}
            />
          );

        case "onboarding_complete":
          return (
            <ProfileConfirmationView
              key={node.key}
              data={parsed.data}
              onComplete={onProfileConfirm}
            />
          );

        case "chart_data":
          return <ChartDataView key={node.key} data={parsed.data} />;

        default:
          // Unknown type, render as code
          return (
            <YStack key={node.key} style={ruleStyles.fence}>
              <Text style={ruleStyles.fence}>{node.content}</Text>
            </YStack>
          );
      }
    } catch (e) {
      // JSON incomplete during streaming
      if (isStreaming) {
        return (
          <YStack
            key={node.key}
            style={ruleStyles.fence}
            justifyContent="center"
            alignItems="center"
            padding="$4"
          >
            <Text color="$textSoft" size="small">
              loading...
            </Text>
          </YStack>
        );
      }

      // Parsing failed, render as code
      return (
        <YStack key={node.key} style={ruleStyles.fence}>
          <Text style={ruleStyles.fence}>{node.content}</Text>
        </YStack>
      );
    }
  },

  code_block: (node: any, children: any, parent: any, ruleStyles: any) => (
    <YStack key={node.key} style={ruleStyles.code_block}>
      <Text style={ruleStyles.code_block}>{node.content}</Text>
    </YStack>
  ),
});

// Helper to detect partial component types in incomplete JSON
export const detectComponentType = (partialContent: string): string | null => {
  const typeMatch = partialContent.match(/"type"\s*:\s*"(\w+)"/);
  return typeMatch ? typeMatch[1] : null;
};
