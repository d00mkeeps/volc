import React from "react";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from "react-native-reanimated";

interface LongPressToEditProps {
  onLongPress: () => void;
  children: React.ReactNode;
  minDurationMs?: number;
  disabled?: boolean;
}

export default function LongPressToEdit({
  onLongPress,
  children,
  minDurationMs = 250,
  disabled = false,
}: LongPressToEditProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const longPress = Gesture.LongPress()
    .minDuration(minDurationMs)
    .onBegin(() => {
      if (disabled) return;
      // Visual feedback - subtle scale down
      scale.value = withSpring(0.95);
      opacity.value = withSpring(0.8);
    })
    .onStart(() => {
      if (disabled) return;
      // Long press activated
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
      runOnJS(onLongPress)();

      // Reset animation
      scale.value = withSpring(1);
      opacity.value = withSpring(1);
    })
    .onFinalize(() => {
      // Reset animation when gesture ends
      scale.value = withSpring(1);
      opacity.value = withSpring(1);
    });

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <GestureDetector gesture={longPress}>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </GestureDetector>
  );
}
