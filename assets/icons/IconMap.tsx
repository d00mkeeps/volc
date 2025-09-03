import Ionicons from "@expo/vector-icons/Ionicons";
import { ComponentProps } from "react";

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
  | "Home" // Add these new ones
  | "User"
  | "MessageCircle"
  | "Trophy";

// Map your app's icon names to @expo/vector-icons
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
};

// Icon component with your app's API
interface AppIconProps extends Omit<ComponentProps<typeof Ionicons>, "name"> {
  name: AppIconName;
}

export const AppIcon = ({
  name,
  size = 24,
  color = "currentColor",
  ...props
}: AppIconProps) => {
  const ionIconName = iconMapping[name];
  return <Ionicons name={ionIconName} size={size} color={color} {...props} />;
};

// Export individual icon components (matches your current API)
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
