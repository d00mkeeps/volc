import React, { useState, useEffect } from "react";
import { YStack, XStack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import PulsingLoader from "./PulsingLoader";
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  runOnJS,
} from "react-native-reanimated";

interface ThinkingIndicatorProps {
  isThinking: boolean;
  showLoadingIndicator: boolean;
  thinkingStartTime: number | null;
  currentThought: string;
  statusMessage?: string | null;
}

export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({
  isThinking,
  showLoadingIndicator,
  thinkingStartTime,
  currentThought,
  statusMessage,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const containerOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  // Extract the last bold title from currentThought
  const getDisplayTitle = () => {
    if (!currentThought) return "Thinking";

    // Match all **text** blocks
    const matches = Array.from(currentThought.matchAll(/\*\*([^*]+)\*\*/g));
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1][1];
      // Clean up trailing colon
      return lastMatch.replace(/:$/, "").trim();
    }

    return "Thinking";
  };

  const displayTitle = getDisplayTitle();

  // Loader visibility effect
  useEffect(() => {
    if (showLoadingIndicator || isThinking) {
      containerOpacity.value = withTiming(1, { duration: 200 });
    } else {
      containerOpacity.value = withTiming(0, { duration: 400 });
    }
  }, [showLoadingIndicator, isThinking]);

  // Thinking text effect
  useEffect(() => {
    if (isThinking) {
      textOpacity.value = withTiming(1, { duration: 1000 });

      const interval = setInterval(() => {
        if (!thinkingStartTime) return;
        const elapsed = Math.floor((Date.now() - thinkingStartTime) / 1000);
        setElapsedSeconds(elapsed);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      textOpacity.value = withTiming(0, { duration: 400 });
      setElapsedSeconds(0);
    }
  }, [isThinking, thinkingStartTime]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  // We always render the space if either loading or thinking is active
  // to prevent layout snaps when the model starts thinking after 1.5s.
  return (
    <XStack
      width="100%"
      justifyContent="flex-start"
      paddingHorizontal="$4"
      paddingVertical="$2"
      minHeight={40}
    >
      <Animated.View style={[containerAnimatedStyle]}>
        <YStack maxWidth="90%" gap="$2">
          {/* Horizontal: Loader + Timer/Title */}
          <XStack gap="$2" alignItems="center">
            <PulsingLoader size={30} />
            <Animated.View style={[textAnimatedStyle]}>
              <XStack gap="$1">
                <Text size="small" color="$textMuted" fontWeight="700">
                  {displayTitle}
                </Text>
                <Text size="small" color="$textMuted">
                  {elapsedSeconds}s
                </Text>
              </XStack>
            </Animated.View>
          </XStack>

          {/* Status message (if any) */}
          {statusMessage && (
            <Text size="small" color="$textMuted">
              {statusMessage}
            </Text>
          )}
        </YStack>
      </Animated.View>
    </XStack>
  );
};
