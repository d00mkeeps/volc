import { View } from "react-native";
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useEffect } from "react";

interface PulsingLoaderProps {
  size?: number;
}

export default function PulsingLoader({ size = 40 }: PulsingLoaderProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.7);
  const backScale = useSharedValue(1.5);
  const backOpacity = useSharedValue(0.3);
  const thirdScale = useSharedValue(1.2);
  const thirdOpacity = useSharedValue(0.5);
  const rotations = {
    outer: useSharedValue(0),
    middle: useSharedValue(0),
    inner: useSharedValue(0),
  };
  const durations = {
    rotations: [1200, 1700, 2300],
    pulses: [950, 1050, 1000],
  };

  useEffect(() => {
    rotations.outer.value = withRepeat(
      withTiming(360, { duration: durations.rotations[0] }),
      -1
    );
    rotations.middle.value = withRepeat(
      withTiming(-360, { duration: durations.rotations[1] }),
      -1
    );
    rotations.inner.value = withRepeat(
      withTiming(360, { duration: durations.rotations[2] }),
      -1
    );

    scale.value = withRepeat(
      withTiming(1.5, { duration: durations.pulses[0] }),
      -1,
      true
    );
    opacity.value = withRepeat(
      withTiming(0.25, { duration: durations.pulses[0] }),
      -1,
      true
    );

    backScale.value = withRepeat(
      withTiming(1, { duration: durations.pulses[1] }),
      -1,
      true
    );
    backOpacity.value = withRepeat(
      withTiming(0.5, { duration: durations.pulses[1] }),
      -1,
      true
    );

    thirdScale.value = withRepeat(
      withTiming(1.7, { duration: durations.pulses[2] }),
      -1,
      true
    );
    thirdOpacity.value = withRepeat(
      withTiming(0.15, { duration: durations.pulses[2] }),
      -1,
      true
    );
  }, []);

  const styles = {
    front: useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    })),
    back: useAnimatedStyle(() => ({
      transform: [{ scale: backScale.value }],
      opacity: backOpacity.value,
    })),
    third: useAnimatedStyle(() => ({
      transform: [{ scale: thirdScale.value }],
      opacity: thirdOpacity.value,
    })),
    outerRing: useAnimatedStyle(() => ({
      transform: [{ rotate: `${rotations.outer.value}deg` }],
    })),
    middleRing: useAnimatedStyle(() => ({
      transform: [{ rotate: `${rotations.middle.value}deg` }],
    })),
    innerRing: useAnimatedStyle(() => ({
      transform: [{ rotate: `${rotations.inner.value}deg` }],
    })),
  };

  const minPulseSize = size;
  const effectiveSize = size * 0.9;
  const innerRingSize = size * 0.5;
  const middleRingSize = effectiveSize * 0.8;
  const outerRingSize = effectiveSize;

  return (
    <View
      style={{
        width: size,
        height: size,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Pulsing circles - using brand red */}
      <Animated.View
        style={[
          {
            width: minPulseSize,
            height: minPulseSize,
            borderRadius: minPulseSize / 2,
            backgroundColor: "#d4412f", // primaryMuted
            position: "absolute",
          },
          styles.third,
        ]}
      />
      <Animated.View
        style={[
          {
            width: minPulseSize,
            height: minPulseSize,
            borderRadius: minPulseSize / 2,
            backgroundColor: "#f84f3e", // primary
            position: "absolute",
          },
          styles.back,
        ]}
      />
      <Animated.View
        style={[
          {
            width: minPulseSize,
            height: minPulseSize,
            borderRadius: minPulseSize / 2,
            backgroundColor: "#f86b5c", // primaryLight
          },
          styles.front,
        ]}
      />

      {/* Rotating rings - using accent gold */}
      <Animated.View
        style={[
          {
            width: outerRingSize,
            height: outerRingSize,
            borderRadius: outerRingSize / 2,
            borderWidth: 2.5,
            borderColor: "transparent",
            borderTopColor: "#3a3539", // accentColor
            position: "absolute",
          },
          styles.outerRing,
        ]}
      />
      <Animated.View
        style={[
          {
            width: middleRingSize,
            height: middleRingSize,
            borderRadius: middleRingSize / 2,
            borderWidth: 2,
            borderColor: "transparent",
            borderRightColor: "#3a3539", // accentColor
            position: "absolute",
          },
          styles.middleRing,
        ]}
      />
      <Animated.View
        style={[
          {
            width: innerRingSize,
            height: innerRingSize,
            borderRadius: innerRingSize / 2,
            borderWidth: 2,
            borderColor: "transparent",
            borderBottomColor: "#3a3539", // accentColor
            position: "absolute",
          },
          styles.innerRing,
        ]}
      />
    </View>
  );
}
