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
  | "AlertCircle"
  | "Lock"
  | "Clock"
  | "Wrench"
  | "ChevronUp"
  | "NetworkExcellent"
  | "NetworkGood"
  | "NetworkPoor"
  | "NetworkOffline";

const iconMapping: Record<AppIconName, keyof typeof Ionicons.glyphMap> = {
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
  Stop: "stop-circle", // Ionicons mapping
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
};

interface AppIconProps extends Omit<ComponentProps<typeof Ionicons>, "name"> {
  name: AppIconName;
}

// Helper function to resolve Tamagui color tokens
// /assets/icons/IconMap.resolveColor
const resolveColor = (
  color: string | OpaqueColorValue | undefined,
  theme: any
): string | OpaqueColorValue => {
  if (!color) return "currentColor";

  if (typeof color !== "string") return color;

  // If it's a Tamagui token (starts with $), resolve it from theme
  if (color.startsWith("$")) {
    const tokenName = color.slice(1); // Remove the $
    const resolvedColor = theme[tokenName];
    return resolvedColor?.val || resolvedColor || color;
  }

  // Otherwise return the color as-is (hex, rgb, etc.)
  return color;
};

// /assets/icons/IconMap.AppIcon
export const AppIcon = ({
  name,
  size = 24,
  color = "currentColor",
  ...props
}: AppIconProps) => {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const ionIconName = iconMapping[name];

  // Use white icons in dark mode, black icons in light mode
  const defaultColor = colorScheme === "dark" ? "#ffffff" : "#231f20";
  const resolvedColor = resolveColor(color || defaultColor, theme);

  return (
    <Ionicons name={ionIconName} size={size} color={resolvedColor} {...props} />
  );
};

// Export individual icon components
export const Settings = (props: Omit<AppIconProps, "name">) => (
  <AppIcon name="Settings" {...props} />
);

export const Camera = (props: Omit<AppIconProps, "name">) => (
  <AppIcon name="Camera" {...props} />
);
export const ChevronUp = (props: Omit<AppIconProps, "name">) => (
  <AppIcon name="ChevronUp" {...props} />
);

export const FileText = (props: Omit<AppIconProps, "name">) => (
  <AppIcon name="FileText" {...props} />
);

export const ArrowLeftRight = (props: Omit<AppIconProps, "name">) => (
  <AppIcon name="ArrowLeftRight" {...props} />
);

export const Play = (props: Omit<AppIconProps, "name">) => (
  <AppIcon name="Play" {...props} />
);

export const Pause = (props: Omit<AppIconProps, "name">) => (
  <AppIcon name="Pause" {...props} />
);

export const ChevronDown = (props: Omit<AppIconProps, "name">) => (
  <AppIcon name="ChevronDown" {...props} />
);

export const ChevronRight = (props: Omit<AppIconProps, "name">) => (
  <AppIcon name="ChevronRight" {...props} />
);

export const ChevronLeft = (props: Omit<AppIconProps, "name">) => (
  <AppIcon name="ChevronLeft" {...props} />
);

export const Check = (props: Omit<AppIconProps, "name">) => (
  <AppIcon name="Check" {...props} />
);

export const CheckCircle = (props: Omit<AppIconProps, "name">) => (
  <AppIcon name="CheckCircle" {...props} />
);

export const X = (props: Omit<AppIconProps, "name">) => (
  <AppIcon name="X" {...props} />
);

export const Stop = (props: Omit<AppIconProps, "name">) => (
  <AppIcon name="Stop" {...props} />
);

export const Trash2 = (props: Omit<AppIconProps, "name">) => (
  <AppIcon name="Trash2" {...props} />
);

export const Plus = (props: Omit<AppIconProps, "name">) => (
  <AppIcon name="Plus" {...props} />
);

export const RotateCw = (props: Omit<AppIconProps, "name">) => (
  <AppIcon name="RotateCw" {...props} />
);

export const PlusCircle = (props: Omit<AppIconProps, "name">) => (
  <AppIcon name="PlusCircle" {...props} />
);

export const Send = (props: Omit<AppIconProps, "name">) => (
  <AppIcon name="Send" {...props} />
);

export const ArrowLeft = (props: Omit<AppIconProps, "name">) => (
  <AppIcon name="ArrowLeft" {...props} />
);

export const Home = (props: Omit<AppIconProps, "name">) => (
  <AppIcon name="Home" {...props} />
);

export const User = (props: Omit<AppIconProps, "name">) => (
  <AppIcon name="User" {...props} />
);

export const MessageCircle = (props: Omit<AppIconProps, "name">) => (
  <AppIcon name="MessageCircle" {...props} />
);

export const Trophy = (props: Omit<AppIconProps, "name">) => (
  <AppIcon name="Trophy" {...props} />
);

export const Pencil = (props: Omit<AppIconProps, "name">) => (
  <AppIcon name="Pencil" {...props} />
);

export const Edit = (props: Omit<AppIconProps, "name">) => (
  <AppIcon name="Edit" {...props} />
);

export const Info = (props: Omit<AppIconProps, "name">) => (
  <AppIcon name="Info" {...props} />
);

export const AlertTriangle = (props: Omit<AppIconProps, "name">) => (
  <AppIcon name="AlertTriangle" {...props} />
);

export const AlertCircle = (props: Omit<AppIconProps, "name">) => (
  <AppIcon name="AlertCircle" {...props} />
);

export const Lock = (props: Omit<AppIconProps, "name">) => (
  <AppIcon name="Lock" {...props} />
);

export const Clock = (props: Omit<AppIconProps, "name">) => (
  <AppIcon name="Clock" {...props} />
);

export const Wrench = (props: Omit<AppIconProps, "name">) => (
  <AppIcon name="Wrench" {...props} />
);

interface NetworkIconProps extends Omit<AppIconProps, "name"> {
  quality: "excellent" | "good" | "poor" | "offline";
  // Added 'name' to props to allow access within component for Stop icon check
  name?: AppIconName;
}

// /assets/icons/IconMap.NetworkStatusIcon
export const NetworkStatusIcon = ({
  quality,
  size = 20,
  color,
  name,
  ...props
}: NetworkIconProps) => {
  const theme = useTheme();
  const colorScheme = useColorScheme();

  // Use same color logic as other icons
  const defaultColor = colorScheme === "dark" ? "#ffffff" : "#231f20";
  const resolvedColor = resolveColor(color || defaultColor, theme);

  // iOS: Use SF Symbols
  if (Platform.OS === "ios") {
    let symbolName: string;
    switch (quality) {
      case "excellent":
        symbolName = "wifi";
        break;
      case "good":
        symbolName = "wifi";
        break;
      case "poor":
        symbolName = "wifi.exclamationmark";
        break;
      case "offline":
        symbolName = "wifi.slash";
        break;
    }

    if (name === "Stop") {
      return (
        <SFSymbol
          name="stop.circle.fill"
          size={size}
          color={resolvedColor}
          {...(props as any)}
        />
      );
    }

    return (
      <SFSymbol
        name={symbolName}
        size={size}
        color={resolvedColor}
        {...(props as any)}
      />
    );
  }

  // Android: Use Ionicons fallback
  let iconName: AppIconName;
  switch (quality) {
    case "excellent":
    case "good":
      iconName = "NetworkGood";
      break;
    case "poor":
      iconName = "NetworkPoor";
      break;
    case "offline":
      iconName = "NetworkOffline";
      break;
  }

  return (
    <AppIcon name={iconName} size={size} color={resolvedColor} {...props} />
  );
};
