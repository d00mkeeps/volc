import { create } from "zustand";

interface AuthStoreState {
  initialized: boolean;
  setInitialized: (value: boolean) => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  initialized: false,
  setInitialized: (value: boolean) => set({ initialized: value }),
}));
