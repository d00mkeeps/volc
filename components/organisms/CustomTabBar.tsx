import React, { useEffect } from "react";
import {
  TouchableOpacity,
  useColorScheme,
  StyleSheet,
  View,
} from "react-native";
import { XStack, YStack } from "tamagui";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { AppIcon } from "@/assets/icons/IconMap";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

const AnimatedYStack = Animated.createAnimatedComponent(YStack);

interface CustomTabBarProps {
  activeIndex: number;
  onTabPress: (index: number) => void;
  onLayout?: (height: number) => void;
}

export default function CustomTabBar({
  activeIndex,
  onTabPress,
  onLayout,
}: CustomTabBarProps) {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const activeColor = "#f84f3e";
  const inactiveColor = colorScheme === "dark" ? "#6b6466" : "#999999";

  const homeProgress = useSharedValue(activeIndex === 0 ? 1 : 0);
  const workoutProgress = useSharedValue(activeIndex === 1 ? 1 : 0);

  useEffect(() => {
    homeProgress.value = withTiming(activeIndex === 0 ? 1 : 0, {
      duration: 200,
    });
    workoutProgress.value = withTiming(activeIndex === 1 ? 1 : 0, {
      duration: 200,
    });
  }, [activeIndex]);

  const homeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + homeProgress.value * 0.1 }],
  }));

  const workoutAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + workoutProgress.value * 0.1 }],
  }));

  const homeActiveStyle = useAnimatedStyle(() => ({
    opacity: homeProgress.value,
  }));
  const homeInactiveStyle = useAnimatedStyle(() => ({
    opacity: 1 - homeProgress.value,
  }));

  const workoutActiveStyle = useAnimatedStyle(() => ({
    opacity: workoutProgress.value,
  }));
  const workoutInactiveStyle = useAnimatedStyle(() => ({
    opacity: 1 - workoutProgress.value,
  }));

  const BLUR_GRADIENT_HEIGHT = 40 + insets.bottom;
  const TAB_BAR_HEIGHT = insets.bottom;

  const handlePress = (index: number) => {
    // Instant feedback: start local animation immediately
    if (index === 0) {
      homeProgress.value = withTiming(1, { duration: 200 });
      workoutProgress.value = withTiming(0, { duration: 200 });
    } else {
      homeProgress.value = withTiming(0, { duration: 200 });
      workoutProgress.value = withTiming(1, { duration: 200 });
    }
    onTabPress(index);
  };

  return (
    <YStack
      position="absolute"
      bottom={0}
      left={0}
      right={0}
      height={BLUR_GRADIENT_HEIGHT}
      pointerEvents="box-none"
    >
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <MaskedView
          style={{ flex: 1 }}
          maskElement={
            <LinearGradient
              colors={["transparent", "black"]}
              locations={[0, 0.5]}
              style={{ flex: 1 }}
            />
          }
        >
          <BlurView
            intensity={15}
            tint={colorScheme === "dark" ? "dark" : "light"}
            style={{ flex: 1 }}
          />
        </MaskedView>
      </View>

      <XStack
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        height={TAB_BAR_HEIGHT}
        paddingBottom={insets.bottom - 18}
        justifyContent="space-around"
        alignItems="flex-end"
        onLayout={(e) => onLayout?.(e.nativeEvent.layout.height)}
        pointerEvents="auto"
      >
        <TouchableOpacity
          onPress={() => handlePress(0)}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <AnimatedYStack
            alignItems="center"
            justifyContent="center"
            style={homeAnimatedStyle}
          >
            <View style={{ width: 24, height: 12 }}>
              <Animated.View
                style={[StyleSheet.absoluteFill, homeInactiveStyle]}
              >
                <AppIcon name="Home" size={24} color={inactiveColor} />
              </Animated.View>
              <Animated.View style={[StyleSheet.absoluteFill, homeActiveStyle]}>
                <AppIcon name="Home" size={24} color={activeColor} />
              </Animated.View>
            </View>
          </AnimatedYStack>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handlePress(1)}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <AnimatedYStack
            alignItems="center"
            justifyContent="center"
            style={workoutAnimatedStyle}
          >
            <View style={{ width: 24, height: 12 }}>
              <Animated.View
                style={[StyleSheet.absoluteFill, workoutInactiveStyle]}
              >
                <AppIcon name="Trophy" size={24} color={inactiveColor} />
              </Animated.View>
              <Animated.View
                style={[StyleSheet.absoluteFill, workoutActiveStyle]}
              >
                <AppIcon name="Trophy" size={24} color={activeColor} />
              </Animated.View>
            </View>
          </AnimatedYStack>
        </TouchableOpacity>
      </XStack>
    </YStack>
  );
}
