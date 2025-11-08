// /components/atoms/core/ShimmerBox.tsx

import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";

interface ShimmerBoxProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

export default function ShimmerBox({
  width = "100%",
  height = 20,
  borderRadius = 8,
  style,
}: ShimmerBoxProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 3300,
          useNativeDriver: false, // Need to set to false for color interpolation
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 3300,
          useNativeDriver: false,
        }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, [shimmerAnim]);

  const backgroundColor = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#111", "#b3342876"], // Dark to brand red
  });

  return (
    <Animated.View
      style={{
        width,
        height,
        borderRadius,
        backgroundColor,
        ...style,
      }}
    />
  );
}
