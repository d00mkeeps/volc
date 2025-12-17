// /assets/icons/IconMap.tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import { ComponentProps } from "react";
import { useTheme } from "tamagui";
import { OpaqueColorValue, useColorScheme, Platform } from "react-native";
import { SFSymbol } from "react-native-sfsymbols";

export type AppIconName =
  | "Settings"
  | "FileText"
  | "ArrowLeftRight"
  | "Play"
  | "Pause"
  | "ChevronDown"
  | "ChevronRight"
  | "Check"
  | "CheckCircle"
  | "X"
  | "Stop"
  | "Trash2"
  | "Plus"
  | "Camera"
  | "RotateCw"
  | "PlusCircle"
  | "Send"
  | "ArrowLeft"
  | "Home"
  | "User"
  | "MessageCircle"
  | "Trophy"
  | "Pencil"
  | "ChevronLeft"
  | "Edit"
  | "Info"
  | "AlertTriangle"
  | "AlertCircle"
  | "Lock"
  | "Clock"
  | "Wrench"
  | "ChevronUp"
  | "NetworkExcellent"
  | "NetworkGood"
  | "NetworkPoor"
  | "NetworkOffline"
  | "GripVertical"
  | "Dumbbell";

// Ionicons mapping (Android fallback)
const ioniconsMapping: Record<AppIconName, keyof typeof Ionicons.glyphMap> = {
  Camera: "camera",
  ChevronUp: "chevron-up",
  Settings: "settings-outline",
  FileText: "document-text-outline",
  ArrowLeftRight: "swap-horizontal-outline",
  Play: "play",
  Pause: "pause",
  ChevronDown: "chevron-down",
  ChevronLeft: "chevron-back",
  ChevronRight: "chevron-forward",
  Check: "checkmark-sharp",
  CheckCircle: "checkmark-circle",
  X: "close",
  Stop: "stop-circle",
  Trash2: "trash-outline",
  Plus: "add",
  RotateCw: "refresh",
  PlusCircle: "add-circle-outline",
  Send: "send",
  ArrowLeft: "arrow-back",
  Home: "home-outline",
  User: "person-outline",
  MessageCircle: "chatbubble-outline",
  Trophy: "trophy-outline",
  Pencil: "create-outline",
  Edit: "pencil-outline",
  Info: "information-circle-outline",
  AlertTriangle: "warning-outline",
  AlertCircle: "alert-circle-outline",
  Lock: "lock-closed-outline",
  Clock: "time-outline",
  Wrench: "construct-outline",
  NetworkExcellent: "wifi",
  NetworkGood: "wifi",
  NetworkPoor: "wifi-outline",
  NetworkOffline: "cloud-offline-outline",
  GripVertical: "menu-outline",
  Dumbbell: "barbell-outline",
};

// SF Symbols mapping (iOS)
const sfSymbolsMapping: Partial<Record<AppIconName, string>> = {
  Camera: "camera",
  ChevronUp: "chevron.up",
  Settings: "gear",
  FileText: "doc.text",
  ArrowLeftRight: "arrow.left.arrow.right",
  Play: "play.fill",
  Pause: "pause.fill",
  ChevronDown: "chevron.down",
  ChevronLeft: "chevron.left",
  ChevronRight: "chevron.right",
  Check: "checkmark",
  CheckCircle: "checkmark.circle",
  X: "xmark",
  Stop: "stop.circle",
  Trash2: "trash",
  Plus: "plus",
  RotateCw: "arrow.clockwise",
  PlusCircle: "plus.circle",
  Send: "paperplane.fill",
  ArrowLeft: "arrow.left",
  Home: "house",
  User: "person",
  MessageCircle: "bubble.left.and.text.bubble.right",
  Trophy: "trophy.fill",
  Pencil: "pencil",
  Edit: "pencil",
  Info: "info.circle",
  AlertTriangle: "exclamationmark.triangle",
  AlertCircle: "exclamationmark.circle",
  Lock: "lock",
  Clock: "clock",
  Wrench: "wrench",
  NetworkExcellent: "wifi",
  NetworkGood: "wifi",
  NetworkPoor: "wifi.exclamationmark",
  NetworkOffline: "wifi.slash",
  GripVertical: "line.3.horizontal",
  Dumbbell: "dumbbell.fill",
};

// /assets/icons/IconMap.resolveColor
const resolveColor = (
  color: string | OpaqueColorValue | undefined,
  theme: any,
  colorScheme: string | null | undefined
): string | OpaqueColorValue => {
  if (!color || color === "currentColor") {
    // Default to white in dark mode, black in light mode
    return colorScheme === "dark" ? "#ffffff" : "#231f20";
  }

  if (typeof color !== "string") return color;

  // Resolve Tamagui tokens (starts with $)
  if (color.startsWith("$")) {
    const tokenName = color.slice(1);
    const resolvedColor = theme[tokenName];
    return resolvedColor?.val || resolvedColor || color;
  }

  return color;
};

interface AppIconProps extends Omit<ComponentProps<typeof Ionicons>, "name"> {
  name: AppIconName;
}

// /assets/icons/IconMap.AppIcon
export const AppIcon = ({
  name,
  size = 24,
  color = "currentColor",
  ...props
}: AppIconProps) => {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const resolvedColor = resolveColor(color, theme, colorScheme);

  // iOS: Use SF Symbols when available
  if (Platform.OS === "ios") {
    const sfSymbol = sfSymbolsMapping[name];
    if (sfSymbol) {
      return (
        <SFSymbol
          name={sfSymbol}
          size={size}
          color={resolvedColor}
          {...(props as any)}
        />
      );
    }
  }

  // Android or fallback: Use Ionicons
  const ionIconName = ioniconsMapping[name];
  return (
    <Ionicons name={ionIconName} size={size} color={resolvedColor} {...props} />
  );
};
