// /utils/markdown/streamingMarkdownRenderer.tsx

import React, { useState, useEffect, useMemo, useRef } from "react";
import { YStack } from "tamagui";
import Animated, { FadeIn } from "react-native-reanimated";
import Markdown from "react-native-markdown-display";
import { createCustomRules, detectComponentType } from "./customRules";
import WorkoutTemplateView from "@/components/molecules/workout/WorkoutTemplateView";
import ProfileConfirmationView from "@/components/molecules/ProfileConfirmationView";
import ChartDataView from "@/components/molecules/visualization/ChartDataView";
import Text from "@/components/atoms/core/Text";

interface StreamingMarkdownProps {
  content: string;
  styles: any;
  onTemplateApprove?: (templateData: any) => void;
  onProfileConfirm?: () => void;
}

interface ContentSegment {
  content: string;
  startIndex: number;
  endIndex: number;
  isNew: boolean;
  type: "markdown" | "component";
  componentType?: string;
  componentData?: any;
}

export const StreamingMarkdownRenderer = ({
  content,
  styles,
  onTemplateApprove,
  onProfileConfirm,
}: StreamingMarkdownProps) => {
  const prevLengthRef = useRef(0);
  const contentRef = useRef(content);

  // Parse content into segments
  const segments = useMemo(() => {
    const prevLength = prevLengthRef.current;
    const result: ContentSegment[] = [];

    // Find all fence blocks (```)
    const fenceRegex = /```[\s\S]*?```/g;
    let lastIndex = 0;
    let match;

    while ((match = fenceRegex.exec(content)) !== null) {
      const fenceStart = match.index;
      const fenceEnd = fenceRegex.lastIndex;
      const fenceContent = match[0].slice(3, -3).trim();

      // Add markdown before fence
      if (fenceStart > lastIndex) {
        result.push({
          content: content.slice(lastIndex, fenceStart),
          startIndex: lastIndex,
          endIndex: fenceStart,
          isNew: lastIndex >= prevLength,
          type: "markdown",
        });
      }

      // Check if fence is a component
      const looksLikeJSON =
        fenceContent.startsWith("{") || fenceContent.startsWith("[");

      if (looksLikeJSON) {
        try {
          const parsed = JSON.parse(fenceContent);
          if (
            parsed.type &&
            ["workout_template", "onboarding_complete", "chart_data"].includes(
              parsed.type
            )
          ) {
            result.push({
              content: match[0],
              startIndex: fenceStart,
              endIndex: fenceEnd,
              isNew: fenceStart >= prevLength,
              type: "component",
              componentType: parsed.type,
              componentData: parsed.data,
            });
          } else {
            // JSON but not our component type
            result.push({
              content: match[0],
              startIndex: fenceStart,
              endIndex: fenceEnd,
              isNew: fenceStart >= prevLength,
              type: "markdown",
            });
          }
        } catch (e) {
          // Incomplete JSON - check for partial type detection
          const detectedType = detectComponentType(fenceContent);

          result.push({
            content: match[0],
            startIndex: fenceStart,
            endIndex: fenceEnd,
            isNew: fenceStart >= prevLength,
            type: detectedType ? "component" : "markdown",
            componentType: detectedType || undefined,
            componentData: null, // Incomplete
          });
        }
      } else {
        // Regular code block
        result.push({
          content: match[0],
          startIndex: fenceStart,
          endIndex: fenceEnd,
          isNew: fenceStart >= prevLength,
          type: "markdown",
        });
      }

      lastIndex = fenceEnd;
    }

    // Add remaining markdown
    if (lastIndex < content.length) {
      result.push({
        content: content.slice(lastIndex),
        startIndex: lastIndex,
        endIndex: content.length,
        isNew: lastIndex >= prevLength,
        type: "markdown",
      });
    }
    prevLengthRef.current = content.length;
    return result;
  }, [content]);

  const customRules = createCustomRules({
    isStreaming: true,
    onTemplateApprove,
    onProfileConfirm,
    styles,
  });

  const renderSegment = (segment: ContentSegment, index: number) => {
    const key = `segment-${segment.startIndex}-${index}`;

    if (segment.type === "component") {
      // Render component
      const component = (() => {
        if (!segment.componentData) {
          // Show skeleton for incomplete component
          return (
            <YStack
              padding="$4"
              justifyContent="center"
              alignItems="center"
              style={styles.fence}
            >
              <Text color="$textSoft" size="small">
                loading {segment.componentType}...
              </Text>
            </YStack>
          );
        }

        switch (segment.componentType) {
          case "workout_template":
            return (
              <WorkoutTemplateView
                data={segment.componentData}
                onApprove={onTemplateApprove}
              />
            );
          case "onboarding_complete":
            return (
              <ProfileConfirmationView
                data={segment.componentData}
                onComplete={onProfileConfirm}
              />
            );
          case "chart_data":
            return <ChartDataView data={segment.componentData} />;
          default:
            return null;
        }
      })();

      return segment.isNew ? (
        <Animated.View key={key} entering={FadeIn.duration(700)}>
          {component}
        </Animated.View>
      ) : (
        <YStack key={key}>{component}</YStack>
      );
    }

    // Render markdown
    const markdownContent = segment.content.replace(
      /```[\s\S]*?```/g,
      (match) => {
        // Remove fences that are handled as components
        return match;
      }
    );

    return segment.isNew ? (
      <Animated.View key={key} entering={FadeIn.duration(700)}>
        <Markdown style={styles} rules={customRules}>
          {markdownContent}
        </Markdown>
      </Animated.View>
    ) : (
      <YStack key={key}>
        <Markdown style={styles} rules={customRules}>
          {markdownContent}
        </Markdown>
      </YStack>
    );
  };

  return (
    <YStack>
      {segments.map((segment, index) => renderSegment(segment, index))}
    </YStack>
  );
};
