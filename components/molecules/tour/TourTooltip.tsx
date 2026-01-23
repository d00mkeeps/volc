import React, { useEffect } from "react";
import { Modal, TouchableOpacity, View, StyleSheet } from "react-native";
import { YStack, XStack, useTheme } from "tamagui";
import { BlurView } from "expo-blur";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import Text from "@/components/atoms/core/Text";
import Button from "@/components/atoms/core/Button";
import { useLayoutStore } from "@/stores/layoutStore";
import { TourStepId } from "@/utils/tourPersistence";

interface TourTooltipProps {
  stepId: TourStepId;
  isVisible: boolean;
  title: string;
  message: string;
  targetPosition: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  onComplete: () => void;
  onDismiss: () => void;
  showPulse?: boolean;
}

const TOOLTIP_WIDTH = 280;
const TOOLTIP_PADDING = 20;

export default function TourTooltip({
  isVisible,
  title,
  message,
  targetPosition,
  onComplete,
  onDismiss,
  showPulse = true,
}: TourTooltipProps) {
  const theme = useTheme();
  const screenWidth = useLayoutStore((state) => state.screenWidth);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (isVisible && showPulse) {
      pulseScale.value = withRepeat(
        withTiming(1.15, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      pulseScale.value = 1;
    }
  }, [isVisible, showPulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  if (!isVisible) return null;

  // Calculate tooltip position - prefer below target, but adjust if near screen edge
  const tooltipTop = targetPosition.y + targetPosition.height + 16;
  const centeredLeft =
    targetPosition.x + targetPosition.width / 2 - TOOLTIP_WIDTH / 2;
  const tooltipLeft = Math.max(
    TOOLTIP_PADDING,
    Math.min(centeredLeft, screenWidth - TOOLTIP_WIDTH - TOOLTIP_PADDING),
  );

  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <BlurView intensity={25} style={StyleSheet.absoluteFill}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onDismiss}
        >
          {/* Highlight pulse around target */}
          {showPulse && (
            <Animated.View
              style={[
                styles.pulseHighlight,
                {
                  top: targetPosition.y - 6,
                  left: targetPosition.x - 6,
                  width: targetPosition.width + 12,
                  height: targetPosition.height + 12,
                  borderColor: theme.primary?.val || "#3b82f6",
                },
                pulseStyle,
              ]}
            />
          )}

          {/* Tooltip card */}
          <View
            style={[
              styles.tooltipCard,
              {
                top: tooltipTop,
                left: tooltipLeft,
                backgroundColor: theme.backgroundSoft?.val || "#1f1f1f",
              },
            ]}
          >
            <YStack gap="$3" padding="$4">
              <Text size="large" fontWeight="600" color="$color">
                {title}
              </Text>
              <Text size="medium" color="$textSoft">
                {message}
              </Text>
              <XStack gap="$2" justifyContent="flex-end" marginTop="$2">
                <Button
                  size="small"
                  backgroundColor="transparent"
                  color="$textMuted"
                  onPress={onDismiss}
                >
                  Skip
                </Button>
                <Button
                  size="small"
                  backgroundColor="$primary"
                  color="white"
                  onPress={onComplete}
                >
                  Got it
                </Button>
              </XStack>
            </YStack>
          </View>
        </TouchableOpacity>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  pulseHighlight: {
    position: "absolute",
    borderWidth: 2,
    borderRadius: 8,
    borderStyle: "dashed",
  },
  tooltipCard: {
    position: "absolute",
    width: TOOLTIP_WIDTH,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});
