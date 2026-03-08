import React from "react";
import { View, StyleSheet, useColorScheme } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SafeAreaBlurGuardProps {
  position: "top" | "bottom";
  intensity?: number;
}

export default function SafeAreaBlurGuard({
  position,
  intensity = 15,
}: SafeAreaBlurGuardProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();

  const height = position === "top" ? insets.top : insets.bottom;
  if (height === 0) return null;

  return (
    <View
      style={[
        styles.container,
        position === "top" ? { top: 0, height } : { bottom: 0, height },
      ]}
      pointerEvents="none"
    >
      <MaskedView
        style={{ flex: 1 }}
        maskElement={
          <LinearGradient
            colors={
              position === "top"
                ? ["black", "transparent"]
                : ["transparent", "black"]
            }
            style={{ flex: 1 }}
          />
        }
      >
        <BlurView
          intensity={intensity}
          tint={colorScheme === "dark" ? "dark" : "light"}
          style={{ flex: 1 }}
        />
      </MaskedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
