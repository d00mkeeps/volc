import { create } from "zustand";

interface LayoutStore {
  dashboardHeight: number;
  tabBarHeight: number;
  quickActionsHeight: number;
  inputAreaHeight: number;
  headerHeight: number; // NEW
  setDashboardHeight: (height: number) => void;
  setTabBarHeight: (height: number) => void;
  setQuickActionsHeight: (height: number) => void;
  setInputAreaHeight: (height: number) => void;
  setHeaderHeight: (height: number) => void; // NEW
  expandChatOverlay: (() => void) | null; // NEW
  setExpandChatOverlay: (fn: (() => void) | null) => void; // NEW
}

export const useLayoutStore = create<LayoutStore>((set) => ({
  dashboardHeight: 0,
  tabBarHeight: 50,
  quickActionsHeight: 0,
  inputAreaHeight: 0,
  headerHeight: 0, // NEW
  expandChatOverlay: null, // NEW
  setDashboardHeight: (height) => set({ dashboardHeight: height }),
  setTabBarHeight: (height) => set({ tabBarHeight: height }),
  setQuickActionsHeight: (height) => set({ quickActionsHeight: height }),
  setInputAreaHeight: (height) => set({ inputAreaHeight: height }),
  setHeaderHeight: (height) => set({ headerHeight: height }), // NEW
  setExpandChatOverlay: (fn) => set({ expandChatOverlay: fn }), // NEW
}));
