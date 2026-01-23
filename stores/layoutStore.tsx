import { create } from "zustand";
import { Dimensions } from "react-native";

// Get initial dimensions
const { width: initialWidth, height: initialHeight } = Dimensions.get("window");

// Breakpoint thresholds
const SMALL_BREAKPOINT = 375; // iPhone SE and smaller
const LARGE_BREAKPOINT = 428; // iPhone Plus/Max and larger

// Helper to determine device size
type DeviceSize = "small" | "standard" | "large";
const getDeviceSize = (width: number): DeviceSize => {
  if (width < SMALL_BREAKPOINT) return "small";
  if (width > LARGE_BREAKPOINT) return "large";
  return "standard";
};

// Responsive token type definition
interface ResponsiveTokens {
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  spacing: { xs: number; sm: number; md: number; lg: number; xl: number };
  iconSize: { sm: number; md: number; lg: number };
  cardPadding: number;
  borderRadius: { sm: number; md: number; lg: number };
}

// Responsive token definitions per device size
const responsiveTokens: Record<DeviceSize, ResponsiveTokens> = {
  small: {
    fontSize: { xs: 10, sm: 12, md: 14, lg: 16, xl: 20, xxl: 24 },
    spacing: { xs: 4, sm: 6, md: 10, lg: 14, xl: 18 },
    iconSize: { sm: 16, md: 20, lg: 24 },
    cardPadding: 10,
    borderRadius: { sm: 6, md: 10, lg: 14 },
  },
  standard: {
    fontSize: { xs: 11, sm: 13, md: 15, lg: 18, xl: 22, xxl: 28 },
    spacing: { xs: 6, sm: 8, md: 12, lg: 16, xl: 20 },
    iconSize: { sm: 18, md: 22, lg: 28 },
    cardPadding: 14,
    borderRadius: { sm: 8, md: 12, lg: 16 },
  },
  large: {
    fontSize: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24, xxl: 32 },
    spacing: { xs: 8, sm: 10, md: 14, lg: 18, xl: 24 },
    iconSize: { sm: 20, md: 24, lg: 32 },
    cardPadding: 16,
    borderRadius: { sm: 8, md: 12, lg: 16 },
  },
};

interface LayoutStore {
  // Existing component heights
  dashboardHeight: number;
  tabBarHeight: number;
  quickActionsHeight: number;
  inputAreaHeight: number;
  headerHeight: number;
  expandChatOverlay: (() => void) | null;

  // Device dimensions
  screenWidth: number;
  screenHeight: number;

  // Breakpoint flags
  deviceSize: DeviceSize;
  isSmallDevice: boolean;
  isLargeDevice: boolean;

  // Responsive tokens
  tokens: ResponsiveTokens;

  // Setters
  setDashboardHeight: (height: number) => void;
  setTabBarHeight: (height: number) => void;
  setQuickActionsHeight: (height: number) => void;
  setInputAreaHeight: (height: number) => void;
  setHeaderHeight: (height: number) => void;
  setExpandChatOverlay: (fn: (() => void) | null) => void;
}

const initialDeviceSize = getDeviceSize(initialWidth);

export const useLayoutStore = create<LayoutStore>((set) => ({
  // Existing component heights
  dashboardHeight: 0,
  tabBarHeight: 50,
  quickActionsHeight: 0,
  inputAreaHeight: 0,
  headerHeight: 0,
  expandChatOverlay: null,

  // Device dimensions (initialized on load)
  screenWidth: initialWidth,
  screenHeight: initialHeight,

  // Breakpoint flags
  deviceSize: initialDeviceSize,
  isSmallDevice: initialDeviceSize === "small",
  isLargeDevice: initialDeviceSize === "large",

  // Responsive tokens
  tokens: responsiveTokens[initialDeviceSize],

  // Setters
  setDashboardHeight: (height) => set({ dashboardHeight: height }),
  setTabBarHeight: (height) => set({ tabBarHeight: height }),
  setQuickActionsHeight: (height) => set({ quickActionsHeight: height }),
  setInputAreaHeight: (height) => set({ inputAreaHeight: height }),
  setHeaderHeight: (height) => set({ headerHeight: height }),
  setExpandChatOverlay: (fn) => set({ expandChatOverlay: fn }),
}));
