// tamagui.config.ts
import { createTamagui } from "tamagui";

console.log("🔧 Creating Tamagui config...");

const tamaguiConfig = createTamagui({
  // Add responsive breakpoints
  media: {
    xs: { maxWidth: 660 }, // Phone
    sm: { minWidth: 661 }, // iPad+
  },
  tokens: {
    color: {
      primary: "#f84f3e",
      primaryLight: "#f86b5c",
      primaryMuted: "#d4412f",
      primaryTint: "#fef7f6",
      primaryPress: "#d4412f",

      white: "#ffffff",
      black: "#231f20",

      red: "#ef4444",
      red8: "#dc2626",
      red9: "#b91c1c",
      red10: "#991b1b",
      green8: "#16a34a",
      green10: "#15803d",
      gray6: "#6b7280",
      gray8: "#374151",

      error: "#ef4444",
    },
    space: {
      1: 4,
      2: 8,
      3: 12,
      4: 16,
      5: 20,
      6: 24, // Added for large components
      7: 30,
      8: 36,
      9: 42,
      10: 50,
      true: 8, // default space
    },
    size: {
      1: 20,
      2: 32,
      3: 44,
      4: 48,
      5: 52,
      6: 56, // Added for large components
      true: 48, // default size
    },
    fontSize: {
      1: 12,
      2: 14,
      3: 16,
      4: 18,
      5: 20,
      6: 24, // Added for large components
      8: 28,
      9: 32,
      true: 18, // default fontSize
    },
    radius: {
      0: 0,
      1: 3,
      2: 5,
      3: 7,
      4: 9,
      true: 5, // default radius
    },
    zIndex: {
      0: 0,
      1: 100,
      2: 200,
      3: 300,
      4: 400,
      5: 500,
      true: 100,
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
      accentColor: "#dbab00",
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
      accentColor: "#967601",
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
        6: 24, // Added for large components
        8: 28,
        9: 32,
        true: 18,
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
        6: 24, // Added for large components
        8: 28,
        9: 32,
        true: 18,
      },
    },
  },
});

console.log("✅ Tamagui config created:", !!tamaguiConfig);
console.log("🔍 Config keys:", Object.keys(tamaguiConfig || {}));

export type AppConfig = typeof tamaguiConfig;
declare module "tamagui" {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig;
