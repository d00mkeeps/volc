import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { UserProfile, UserContextBundle } from "@/types";
import { userProfileService } from "@/services/db/userProfile";
import { authService } from "@/services/db/auth";
import { analysisBundleService } from "@/services/db/context";

interface UserStoreState {
  userProfile: UserProfile | null;
  contextBundle: UserContextBundle | null;
  cachedAvatarUrl: string | null;
  loading: boolean;
  error: Error | null;
  initialized: boolean;

  initializeIfAuthenticated: () => Promise<void>;
  clearData: () => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  setCachedAvatarUrl: (url: string | null) => void;
}

export const useUserStore = create<UserStoreState>()(
  persist(
    (set, get) => {
      const loadProfile = async () => {
        try {
          set({ loading: true, error: null });
          const session = await authService.getSession();
          if (!session?.user?.id) {
            throw new Error("No authenticated user found");
          }

          // Fetch profile
          const profile = await userProfileService.getUserProfile();

          set({
            userProfile: profile,
            initialized: true,
            loading: false // UI is unblocked
          });

          // Fetch context bundle asynchronously without blocking this function
          if (profile.user_id) {
            analysisBundleService.getLatestUserContextBundle(
              profile.user_id.toString(),
            )
            .then(bundle => {
              console.log("🔍 [userProfileStore] Context bundle fetched asynchronously");
              set({ contextBundle: bundle });
            })
            .catch(e => {
              console.warn("Failed to fetch context bundle asynchronously", e);
            });
          }
        } catch (err) {
          set({
            loading: false,
            error:
              err instanceof Error ? err : new Error("Failed to fetch profile"),
            initialized: true,
          });
          console.error("Error fetching profile:", err);
        }
      };

      return {
        userProfile: null,
        contextBundle: null,
        cachedAvatarUrl: null,
        loading: false,
        error: null,
        initialized: false,

        initializeIfAuthenticated: async () => {
          const { initialized, loading } = get();
          if (initialized || loading) return;
          await loadProfile();
        },

        clearData: () => {
          set({
            userProfile: null,
            contextBundle: null,
            cachedAvatarUrl: null,
            loading: false,
            error: null,
            initialized: false,
          });
        },

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
                err instanceof Error
                  ? err
                  : new Error("Failed to fetch profile"),
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
            await userProfileService.saveUserProfile(updates);
            const updatedProfile = await userProfileService.getUserProfile();
            set({ userProfile: updatedProfile });
          } catch (err) {
            set({
              error:
                err instanceof Error
                  ? err
                  : new Error("Failed to update profile"),
            });
            console.error("Error updating profile:", err);
          } finally {
            set({ loading: false });
          }
        },

        setCachedAvatarUrl: (url: string | null) => {
          set({ cachedAvatarUrl: url });
        },
      };
    },
    {
      name: "user-profile-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        userProfile: state.userProfile,
        contextBundle: state.contextBundle,
        cachedAvatarUrl: state.cachedAvatarUrl,
      }),
    },
  ),
);
