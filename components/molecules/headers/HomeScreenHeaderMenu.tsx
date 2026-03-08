import React, { useState, useRef } from "react";
import { Stack, YStack, Separator, XStack } from "tamagui";
import Button from "@/components/atoms/core/Button";
import Text from "@/components/atoms/core/Text";
import { AppIcon } from "@/assets/icons/IconMap";
import {
  Modal,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  useColorScheme,
  View,
  Dimensions,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  withTiming,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNetworkQuality } from "@/hooks/useNetworkQuality";
import { useChatStore } from "@/stores/chat/ChatStore";
import { BlurView } from "expo-blur";

interface ____HomeScreenHeaderMenuProps____ {
  onNewChat: () => void;
  onNewWorkout: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const HomeScreenHeaderMenu = ({
  onNewChat,
  onNewWorkout,
}: ____HomeScreenHeaderMenuProps____) => {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonPos, setButtonPos] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  // Reactive connection state from ChatStore
  const connectionState = useChatStore((state) => state.connectionState);
  const { health } = useNetworkQuality();

  // Use general network health for button availability
  const isConnected = health !== "offline";

  console.log(
    "🔘 [HomeScreenHeaderMenu] health:",
    health,
    "wsState:",
    connectionState,
    "isConnected:",
    isConnected,
  );

  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const buttonRef = useRef<any>(null);

  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  const handleOpen = () => {
    if (buttonRef.current) {
      buttonRef.current.measure(
        (
          x: number,
          y: number,
          width: number,
          height: number,
          pageX: number,
          pageY: number,
        ) => {
          setButtonPos({ x: pageX, y: pageY, width, height });
          setIsOpen(true);
          scale.value = withTiming(1, { duration: 200 });
          opacity.value = withTiming(1, { duration: 200 });
          backdropOpacity.value = withTiming(1, { duration: 300 });
        },
      );
    }
  };

  const handleClose = () => {
    scale.value = withTiming(0.95, { duration: 150 });
    opacity.value = withTiming(0, { duration: 150 });
    backdropOpacity.value = withTiming(0, { duration: 200 });
    setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  const handleNewChat = () => {
    handleClose();
    setTimeout(onNewChat, 200);
  };

  const handleNewWorkout = () => {
    handleClose();
    setTimeout(onNewWorkout, 200);
  };

  const menuAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  // Calculate centered position
  const MENU_WIDTH = 200;
  const menuLeft = buttonPos.x + buttonPos.width / 2 - MENU_WIDTH / 2;
  // Keep within screen bounds
  const constrainedLeft = Math.max(
    16,
    Math.min(SCREEN_WIDTH - MENU_WIDTH - 16, menuLeft),
  );

  return (
    <>
      <View ref={buttonRef} collapsable={false}>
        <Button
          size="$3"
          circular
          onPress={handleOpen}
          backgroundColor="$backgroundHover"
        >
          <Text size="large">+</Text>
        </Button>
      </View>

      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={handleClose}
      >
        <Pressable style={styles.backdrop} onPress={handleClose}>
          <Animated.View
            style={[StyleSheet.absoluteFill, backdropAnimatedStyle]}
          >
            <BlurView
              intensity={20}
              tint={colorScheme === "dark" ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.menuContainer,
              menuAnimatedStyle,
              {
                top: buttonPos.y + buttonPos.height + 10,
                left: constrainedLeft,
                width: MENU_WIDTH,
              },
            ]}
          >
            <BlurView
              intensity={85}
              tint={colorScheme === "dark" ? "dark" : "light"}
              style={styles.blurWrapper}
            >
              <YStack
                paddingVertical="$2"
                borderWidth={1}
                borderColor={
                  colorScheme === "dark"
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(0,0,0,0.08)"
                }
                borderRadius={16}
                overflow="hidden"
              >
                <TouchableOpacity
                  onPress={isConnected ? handleNewChat : undefined}
                  disabled={!isConnected}
                >
                  <XStack
                    alignItems="center"
                    gap="$3"
                    paddingHorizontal="$4"
                    paddingVertical="$3"
                    style={{ opacity: isConnected ? 1 : 0.4 }}
                  >
                    <Stack
                      backgroundColor={
                        colorScheme === "dark"
                          ? "rgba(255,255,255,0.12)"
                          : "rgba(0,0,0,0.06)"
                      }
                      padding="$2"
                      borderRadius="$3"
                    >
                      <AppIcon
                        name="MessageCircle"
                        size={20}
                        color={isConnected ? "$text" : "$textMuted"}
                      />
                    </Stack>
                    <Text
                      size="medium"
                      fontWeight="600"
                      color={isConnected ? "$text" : "$textMuted"}
                    >
                      New Chat {!isConnected && " (Offline)"}
                    </Text>
                  </XStack>
                </TouchableOpacity>

                <Separator marginHorizontal="$4" opacity={0.3} />

                <TouchableOpacity onPress={handleNewWorkout}>
                  <XStack
                    alignItems="center"
                    gap="$3"
                    paddingHorizontal="$4"
                    paddingVertical="$3"
                  >
                    <Stack
                      backgroundColor={
                        colorScheme === "dark"
                          ? "rgba(255,255,255,0.12)"
                          : "rgba(0,0,0,0.06)"
                      }
                      padding="$2"
                      borderRadius="$3"
                    >
                      <AppIcon name="Dumbbell" size={20} color="$text" />
                    </Stack>
                    <Text size="medium" fontWeight="600" color="$text">
                      New Workout
                    </Text>
                  </XStack>
                </TouchableOpacity>
              </YStack>
            </BlurView>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.02)",
  },
  menuContainer: {
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  blurWrapper: {
    borderRadius: 16,
    overflow: "hidden",
  },
});
