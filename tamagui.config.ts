// tamagui.config.ts - MINIMAL VERSION
import { createTamagui } from "tamagui";

const tamaguiConfig = createTamagui({
  tokens: {
    color: {
      // Your custom colors
      primary: "#f84f3e",
      primaryLight: "#f86b5c",
      primaryMuted: "#d4412f",
      primaryTint: "#fef7f6", // light theme
      primaryPress: "#d4412f", // Add this for press states

      // Basic colors
      white: "#ffffff",
      black: "#231f20",

      // Text colors (you'll define these in themes)
      red: "#ef4444",
      red8: "#dc2626",
      red9: "#b91c1c",
      red10: "#991b1b",
      green8: "#16a34a",
      green10: "#15803d",
      gray6: "#6b7280",
      gray8: "#374151",

      // Error
      error: "#ef4444",
    },
    space: {
      1: 4,
      2: 8,
      3: 12,
      4: 16,
    },
    size: {
      2: 32, // Button sizes
      4: 48,
    },
    fontSize: {
      1: 12,
      2: 14,
      3: 16,
      4: 18,
      5: 20,
      8: 28,
      9: 32,
    },
  },
  themes: {
    dark: {
      background: "#231f20",
      backgroundSoft: "#2a2629",
      backgroundMuted: "#1a1718",
      backgroundPress: "#3a3539",
      backgroundStrong: "#3a3539",
      backgroundHover: "#3a3539",

      primary: "#f84f3e",
      primaryLight: "#f86b5c",
      primaryMuted: "#d4412f",
      primaryTint: "#2b1f1e",
      primaryPress: "#d4412f",

      color: "#ffffff",
      text: "#ffffff",
      textSoft: "#b0abac",
      textMuted: "#6b6466",
      colorPress: "#b0abac",

      borderSoft: "rgba(248, 79, 62, 0.1)",
      borderMuted: "rgba(255, 255, 255, 0.05)",
      borderColor: "rgba(255, 255, 255, 0.1)",
    },
    light: {
      background: "#ffffff",
      backgroundSoft: "#f5f4f4",
      backgroundMuted: "#ebebeb",
      backgroundPress: "#e8e8e8",
      backgroundStrong: "#e8e8e8",
      backgroundHover: "#f0f0f0",

      primary: "#f84f3e",
      primaryLight: "#f86b5c",
      primaryMuted: "#d4412f",
      primaryTint: "#fef7f6",
      primaryPress: "#d4412f",

      color: "#231f20",
      text: "#231f20",
      textSoft: "#6b6466",
      textMuted: "#999999",
      colorPress: "#6b6466",

      borderSoft: "#f0f0f0",
      borderMuted: "#f8f8f8",
      borderColor: "#e5e5e5",
    },
  },
  fonts: {
    heading: {
      family: "System",
      size: {
        1: 12,
        2: 14,
        3: 16,
        4: 18,
        5: 20,
        8: 28,
        9: 32,
      },
    },
    body: {
      family: "System",
      size: {
        1: 12,
        2: 14,
        3: 16,
        4: 18,
        5: 20,
        8: 28,
        9: 32,
      },
    },
  },
});

export type AppConfig = typeof tamaguiConfig;
declare module "tamagui" {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig;
