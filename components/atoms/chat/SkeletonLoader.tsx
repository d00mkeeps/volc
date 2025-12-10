import React, { useEffect } from "react";
import { YStack, XStack, Text } from "tamagui";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from "react-native-reanimated";

export const GreetingSkeleton: React.FC = () => {
  const dot1 = useSharedValue(0.3);
  const dot2 = useSharedValue(0.3);
  const dot3 = useSharedValue(0.3);

  useEffect(() => {
    dot1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.3, { duration: 400 })
      ),
      -1
    );
    dot2.value = withDelay(
      200,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1
      )
    );
    dot3.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1
      )
    );
  }, []);

  const dot1Style = useAnimatedStyle(() => ({
    opacity: dot1.value,
  }));

  const dot2Style = useAnimatedStyle(() => ({
    opacity: dot2.value,
  }));

  const dot3Style = useAnimatedStyle(() => ({
    opacity: dot3.value,
  }));

  return (
    <YStack padding="$3">
      <XStack gap="$2" alignItems="center">
        <Animated.View style={dot1Style}>
          <Text fontSize="$6" color="$text">
            •
          </Text>
        </Animated.View>
        <Animated.View style={dot2Style}>
          <Text fontSize="$6" color="$text">
            •
          </Text>
        </Animated.View>
        <Animated.View style={dot3Style}>
          <Text fontSize="$6" color="$text">
            •
          </Text>
        </Animated.View>
      </XStack>
    </YStack>
  );
};

export const ActionsSkeleton: React.FC = () => {
  return (
    <XStack gap="$2" paddingHorizontal="$1">
      {[1, 2, 3].map((i) => (
        <YStack
          key={i}
          backgroundColor="$backgroundHover"
          borderRadius={20}
          paddingHorizontal="$4"
          paddingVertical="$2"
          height={32}
          width={100}
          opacity={0.3}
        />
      ))}
    </XStack>
  );
};
