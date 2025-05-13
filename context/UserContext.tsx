// context/UserContext.tsx
import { createContext, useContext, useState, useEffect } from "react";
import type { UserProfile } from "@/types";
import { UserOnboarding } from "@/types/onboarding";
import { UserContextType } from "@/types/context";
import { userProfileService } from "@/services/supabase/userProfile";

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load profile data on initial mount
  useEffect(() => {
    refreshProfile();
  }, []);

  const refreshProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await userProfileService.getUserProfile();
      setUserProfile(data);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch profile")
      );
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  // Keep the existing parameter type to maintain compatibility
  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      setLoading(true);
      setError(null);

      // Convert Partial<UserProfile> to UserOnboarding or adapt approach
      if (userProfile) {
        // Fetch current complete profile if we need it for the conversion
        const currentProfile = await userProfileService.getUserProfile();

        // Create a UserOnboarding object using the updates
        // You'll need to adapt this based on your actual type structures
        const onboardingData: UserOnboarding = {
          // Merge with current profile data and apply updates
          // This is a placeholder - you'll need to customize this based on your types
          personalInfo: {
            // Add properties from updates or current profile
            ...currentProfile.personalInfo,
            // Apply any updates that might be relevant
            ...(updates as any).personalInfo,
          },
          fitnessBackground: {
            // Similar pattern for fitness background
            ...currentProfile.fitnessBackground,
            ...(updates as any).fitnessBackground,
          },
          // Add any other required fields
          goal: "",
        };

        await userProfileService.saveUserProfile(onboardingData);
      } else {
        throw new Error("Cannot update profile: No user profile loaded");
      }

      // Refresh the profile to get updated data
      await refreshProfile();
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to update profile")
      );
      console.error("Error updating profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    userProfile,
    loading,
    error,
    refreshProfile,
    updateProfile,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
