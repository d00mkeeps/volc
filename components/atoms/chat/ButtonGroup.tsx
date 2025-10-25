import React from "react";
import { useSharedValue } from "react-native-reanimated";

export const useButtonGroup = (
  { width, height }: { width: number; height: number },
  r: number
) => {
  const progress = useSharedValue(0);
  const c1 = useSharedValue([width / 2, height * 0.3]);
  const box = [width / 2 - r, height * 0.7 - r, r * 2, r * 2];
  const bounds = { x: 0, y: 0, width, height };

  return { progress, c1, box, bounds };
};

export const ButtonGroup = () => {
  return null;
};
