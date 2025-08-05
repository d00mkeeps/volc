import { create } from "zustand";
import type { UserProfile } from "@/types";
import { UserOnboarding } from "@/types/onboarding";
import { userProfileService } from "@/services/db/userProfile";
import { authService } from "@/services/db/auth";

interface UserStoreState {
  // State
  userProfile: UserProfile | null;
  loading: boolean;
  error: Error | null;
  initialized: boolean;

  // Auth-triggered methods (called by authStore)
  initializeIfAuthenticated: () => Promise<void>;
  clearData: () => void;

  // Public methods (called by components)
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export const useUserStore = create<UserStoreState>((set, get) => {
  const loadProfile = async () => {
    try {
      console.log("Getting user profile");
      set({ loading: true, error: null });

      const session = await authService.getSession();
      if (!session?.user?.id) {
        throw new Error("No authenticated user found");
      }

      const data = await userProfileService.getUserProfile();
      console.log("User profile retrieved successfully");
      set({ userProfile: data, initialized: true });
    } catch (err) {
      set({
        error:
          err instanceof Error ? err : new Error("Failed to fetch profile"),
        initialized: true,
      });
      console.error("Error fetching profile:", err);
    } finally {
      set({ loading: false });
    }
  };

  return {
    // Initial state - clean slate, no immediate loading
    userProfile: null,
    loading: false,
    error: null,
    initialized: false,

    // Called by authStore when user becomes authenticated
    initializeIfAuthenticated: async () => {
      const { initialized, loading } = get();
      if (initialized || loading) return; // Prevent double-initialization

      await loadProfile();
    },

    // Called by authStore when user logs out
    clearData: () => {
      set({
        userProfile: null,
        loading: false,
        error: null,
        initialized: false,
      });
    },

    // Public methods for components
    refreshProfile: async () => {
      try {
        set({ loading: true, error: null });
        const session = await authService.getSession();
        if (!session?.user?.id) {
          throw new Error("No authenticated user found");
        }
        const data = await userProfileService.getUserProfile();
        set({ userProfile: data });
      } catch (err) {
        set({
          error:
            err instanceof Error ? err : new Error("Failed to fetch profile"),
        });
        console.error("Error fetching profile:", err);
      } finally {
        set({ loading: false });
      }
    },

    updateProfile: async (updates: Partial<UserProfile>) => {
      try {
        set({ loading: true, error: null });
        const session = await authService.getSession();
        if (!session?.user?.id) {
          throw new Error("No authenticated user found");
        }

        const { userProfile } = get();
        if (userProfile) {
          const currentProfile = await userProfileService.getUserProfile();
          const onboardingData: UserOnboarding = {
            personalInfo: {
              ...currentProfile.personalInfo,
              ...(updates as any).personalInfo,
            },
            fitnessBackground: {
              ...currentProfile.fitnessBackground,
              ...(updates as any).fitnessBackground,
            },
            goal: "",
          };

          await userProfileService.saveUserProfile(onboardingData);
          const updatedProfile = await userProfileService.getUserProfile();
          set({ userProfile: updatedProfile });
        } else {
          throw new Error("Cannot update profile: No user profile loaded");
        }
      } catch (err) {
        set({
          error:
            err instanceof Error ? err : new Error("Failed to update profile"),
        });
        console.error("Error updating profile:", err);
      } finally {
        set({ loading: false });
      }
    },
  };
});
