import { create } from 'zustand';
import type { UserProfile } from "@/types";
import { UserOnboarding } from "@/types/onboarding";
import { userProfileService } from "@/services/db/userProfile";

interface UserStoreState {
  // State
  userProfile: UserProfile | null;
  loading: boolean;
  error: Error | null;
  
  // Actions
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export const useUserStore = create<UserStoreState>((set, get) => {
  // Load profile data on store initialization
  const loadProfile = async () => {
    try {
      set({ loading: true, error: null });
      const data = await userProfileService.getUserProfile();
      set({ userProfile: data });
    } catch (err) {
      set({
        error: err instanceof Error ? err : new Error("Failed to fetch profile")
      });
      console.error("Error fetching profile:", err);
    } finally {
      set({ loading: false });
    }
  };
  
  // Initialize data loading
  loadProfile();
  
  return {
    // Initial state
    userProfile: null,
    loading: true,
    error: null,
    
    // Actions
    refreshProfile: async () => {
      try {
        set({ loading: true, error: null });
        const data = await userProfileService.getUserProfile();
        set({ userProfile: data });
      } catch (err) {
        set({
          error: err instanceof Error ? err : new Error("Failed to fetch profile")
        });
        console.error("Error fetching profile:", err);
      } finally {
        set({ loading: false });
      }
    },
    
    updateProfile: async (updates: Partial<UserProfile>) => {
      try {
        set({ loading: true, error: null });
        
        // Get current profile state
        const { userProfile } = get();
        
        if (userProfile) {
          // Fetch current complete profile if we need it for the conversion
          const currentProfile = await userProfileService.getUserProfile();
          
          // Create a UserOnboarding object using the updates
          const onboardingData: UserOnboarding = {
            personalInfo: {
              ...currentProfile.personalInfo,
              ...(updates as any).personalInfo,
            },
            fitnessBackground: {
              ...currentProfile.fitnessBackground,
              ...(updates as any).fitnessBackground,
            },
            // Add any other required fields
            goal: "",
          };
          
          await userProfileService.saveUserProfile(onboardingData);
          
          // Refresh the profile to get updated data
          const updatedProfile = await userProfileService.getUserProfile();
          set({ userProfile: updatedProfile });
        } else {
          throw new Error("Cannot update profile: No user profile loaded");
        }
      } catch (err) {
        set({
          error: err instanceof Error ? err : new Error("Failed to update profile")
        });
        console.error("Error updating profile:", err);
      } finally {
        set({ loading: false });
      }
    }
  };
});