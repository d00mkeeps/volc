// components/atoms/GradientBlur.tsx - Remove animation wrapper
import React from "react";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

interface GradientBlurProps {
  style?: any;
  pointerEvents?: "none" | "auto" | "box-none" | "box-only";
}

export default function GradientBlur({
  style,
  pointerEvents,
}: GradientBlurProps) {
  return (
    <>
      <BlurView intensity={60} tint="dark" style={{ flex: 1 }} />
      <LinearGradient
        colors={["rgba(0,0,0,0.2)", "rgba(0,0,0,0.8)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
    </>
  );
}
