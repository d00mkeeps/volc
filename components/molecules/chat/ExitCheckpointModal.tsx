import React, { useEffect, useState } from "react";
import { StyleSheet, Modal, Pressable, useColorScheme } from "react-native";
import { YStack, Button } from "tamagui";
import { BlurView } from "expo-blur";
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  runOnJS,
} from "react-native-reanimated";
import Text from "@/components/atoms/core/Text";

interface ExitCheckpointModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirmExit: () => void;
  onStay: () => void;
}

export const ExitCheckpointModal = ({
  isVisible,
  onClose,
  onConfirmExit,
  onStay,
}: ExitCheckpointModalProps) => {
  const colorScheme = useColorScheme();

  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  const [shouldRender, setShouldRender] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      scale.value = withTiming(1, { duration: 200 });
      opacity.value = withTiming(1, { duration: 200 });
      backdropOpacity.value = withTiming(1, { duration: 300 });
    } else {
      scale.value = withTiming(0.95, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
      backdropOpacity.value = withTiming(0, { duration: 300 }, (finished) => {
        if (finished) {
          runOnJS(setShouldRender)(false);
        }
      });
    }
  }, [isVisible, scale, opacity, backdropOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  return (
    <Modal
      visible={shouldRender}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={[StyleSheet.absoluteFill, backdropAnimatedStyle]}>
          <BlurView
            intensity={20}
            tint={colorScheme === "dark" ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <Animated.View
          style={[styles.modalContainer, animatedStyle]}
          onStartShouldSetResponder={() => true} // prevent touch propagation from closing modal
        >
          <BlurView
            intensity={85}
            tint={colorScheme === "dark" ? "dark" : "light"}
            style={styles.blurWrapper}
          >
            <YStack padding="$5" justifyContent="center" alignItems="center" space="$5">
              <YStack alignItems="center" space="$2" marginHorizontal="$2">
                <Text size="large" fontWeight="bold" textAlign="center">
                  Before you go...
                </Text>
                <Text size="medium" color="$textMuted" textAlign="center">
                  Want me to put a quick plan together? Takes 2 minutes.
                </Text>
              </YStack>

              <YStack width="100%" space="$3" paddingTop="$2">
                <Button
                  size="$4"
                  variant="outlined"
                  borderColor="$borderSoft"
                  color="$textMuted"
                  onPress={onStay}
                  borderRadius="$4"
                >
                  Cancel
                </Button>

                <Button
                  size="$4"
                  backgroundColor="$brandPrimary"
                  color="white"
                  onPress={onConfirmExit}
                  borderRadius="$4"
                >
                  Exit
                </Button>
              </YStack>
            </YStack>
          </BlurView>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.02)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalContainer: {
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  blurWrapper: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(150,150,150,0.1)",
    overflow: "hidden",
  },
});
