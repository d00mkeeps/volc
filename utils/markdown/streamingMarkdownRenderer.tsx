import React, { useState, useEffect, useMemo, useRef } from "react";
import { YStack } from "tamagui";
import Animated, { FadeIn } from "react-native-reanimated";
import Markdown from "react-native-markdown-display";
import {
  createCustomRules,
  detectComponentType,
  parsePartialJSON,
} from "./customRules";
import WorkoutTemplateView from "@/components/molecules/workout/WorkoutTemplateView";
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
  isComplete?: boolean;
}

export const StreamingMarkdownRenderer = ({
  content,
  styles,
  onTemplateApprove,
  onProfileConfirm,
}: StreamingMarkdownProps) => {
  const prevLengthRef = useRef(0);
  const contentRef = useRef(content);

  const customRules = createCustomRules({
    isStreaming: true,
    onTemplateApprove,
    onProfileConfirm,
    styles,
  });

  const segments = useMemo(() => {
    const prevLength = prevLengthRef.current;
    const result: ContentSegment[] = [];

    const fenceRegex = /```[\s\S]*?```/g;
    let lastIndex = 0;
    let match;

    while ((match = fenceRegex.exec(content)) !== null) {
      const fenceStart = match.index;
      const fenceEnd = fenceRegex.lastIndex;
      const fenceContent = match[0].slice(3, -3).trim();

      if (fenceStart > lastIndex) {
        result.push({
          content: content.slice(lastIndex, fenceStart),
          startIndex: lastIndex,
          endIndex: fenceStart,
          isNew: false,
          type: "markdown",
        });
      }

      const looksLikeJSON =
        fenceContent.startsWith("{") || fenceContent.startsWith("[");

      if (looksLikeJSON) {
        const parsed = parsePartialJSON(fenceContent);

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
            isNew: false,
            type: "component",
            componentType: parsed.type,
            componentData: parsed.data || null,
            isComplete: parsed.isComplete,
          });
        } else {
          result.push({
            content: match[0],
            startIndex: fenceStart,
            endIndex: fenceEnd,
            isNew: false,
            type: "markdown",
          });
        }
      } else {
        result.push({
          content: match[0],
          startIndex: fenceStart,
          endIndex: fenceEnd,
          isNew: false,
          type: "markdown",
        });
      }

      lastIndex = fenceEnd;
    }

    if (lastIndex < content.length) {
      result.push({
        content: content.slice(lastIndex),
        startIndex: lastIndex,
        endIndex: content.length,
        isNew: false,
        type: "markdown",
      });
    }

    result.forEach((segment) => {
      segment.isNew = segment.endIndex > prevLength;
    });

    prevLengthRef.current = content.length;
    return result;
  }, [content]);

  const renderSegment = (segment: ContentSegment, index: number) => {
    const dataHash = segment.componentData
      ? JSON.stringify(segment.componentData).length
      : 0;
    const key = `segment-${segment.startIndex}-${index}-${dataHash}`;

    if (segment.type === "component") {
      if (!segment.componentData) {
        return (
          <YStack
            key={key}
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

      const component = (() => {
        switch (segment.componentType) {
          case "workout_template":
            return (
              <WorkoutTemplateView
                data={segment.componentData}
                onApprove={onTemplateApprove}
                isComplete={segment.isComplete}
              />
            );
          case "chart_data":
            return (
              <ChartDataView
                key={`${key}-stable`}
                data={segment.componentData}
              />
            );
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

    const markdownContent = segment.content.replace(
      /```[\s\S]*?```/g,
      (match) => match
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
