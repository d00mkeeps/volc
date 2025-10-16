import Ionicons from "@expo/vector-icons/Ionicons";
import { ComponentProps } from "react";
import { useTheme } from "tamagui";
import { OpaqueColorValue } from "react-native";

export type AppIconName =
  | "Settings"
  | "FileText"
  | "ArrowLeftRight"
  | "Play"
  | "Pause"
  | "ChevronDown"
  | "Check"
  | "X"
  | "Trash2"
  | "Plus"
  | "RotateCw"
  | "PlusCircle"
  | "Send"
  | "ArrowLeft"
  | "Home"
  | "User"
  | "MessageCircle"
  | "Trophy"
  | "Pencil"
  | "Edit"
  | "Info"
  | "AlertTriangle"
  | "AlertCircle";

const iconMapping: Record<AppIconName, keyof typeof Ionicons.glyphMap> = {
  Settings: "settings-outline",
  FileText: "document-text-outline",
  ArrowLeftRight: "swap-horizontal-outline",
  Play: "play",
  Pause: "pause",
  ChevronDown: "chevron-down",
  Check: "checkmark",
  X: "close",
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

  // If it's an OpaqueColorValue (platform color), return as-is
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
  const ionIconName = iconMapping[name];
  const resolvedColor = resolveColor(color, theme);

  return (
    <Ionicons name={ionIconName} size={size} color={resolvedColor} {...props} />
  );
};

// Export individual icon components
export const Settings = (props: Omit<AppIconProps, "name">) => (
  <AppIcon name="Settings" {...props} />
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

export const Check = (props: Omit<AppIconProps, "name">) => (
  <AppIcon name="Check" {...props} />
);

export const X = (props: Omit<AppIconProps, "name">) => (
  <AppIcon name="X" {...props} />
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
