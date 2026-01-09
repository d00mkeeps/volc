import { BaseDBService } from "./base";
import { OnboardingFormData } from "@/types/onboarding";
import { UserProfile } from "@/types";
import { apiGet, apiPost } from "../api/core/apiClient";

export class UserProfileService extends BaseDBService {
  /**
   * Save or update a user's profile information - accepts UserProfile format
   */
  async saveUserProfile(profileData: Partial<UserProfile>) {
    try {
      console.log("Saving user profile:", profileData);
      // Send UserProfile format directly to backend
      const data = await apiPost("/db/user-profile", profileData);
      console.log("User profile saved successfully");
      return data;
    } catch (error) {
      console.error("Error saving user profile:", error);
      throw error;
    }
  }

  /**
   * Save onboarding data (legacy method for UserOnboarding format)
   * Keep this for backward compatibility if needed elsewhere
   */
  async saveUserOnboarding(summary: OnboardingFormData) {
    try {
      console.log("Saving user onboarding:", summary);
      const data = await apiPost("/db/user-profile", summary);
      console.log("User onboarding saved successfully");
      return data;
    } catch (error) {
      console.error("Error saving user onboarding:", error);
      throw error;
    }
  }

  /**
   * Get the current user's profile information
   */
  async getUserProfile(): Promise<UserProfile> {
    try {
      console.log("Getting user profile");
      const data = await apiGet("/db/user-profile");

      // Calculate age if dob exists
      if (data.dob) {
        const dob = new Date(data.dob);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
          age--;
        }
        data.age = age;
      }

      console.log("User profile retrieved successfully");
      return data;
    } catch (error) {
      console.error("Error getting user profile:", error);
      throw error;
    }
  }
  async completeOnboarding(data: OnboardingFormData) {
    try {
      console.log("Completing onboarding:", data);

      const payload = {
        is_imperial: data.isImperial,
        dob: data.dob.toISOString().split("T")[0],
        experience_level: data.experienceLevel,
        training_location: data.trainingLocation,
        ...(data.height && { height: data.height }),
        ...(data.weight && { weight: data.weight }),
      };

      const result = await apiPost("/db/user-profile/onboarding", payload);
      console.log("Onboarding completed successfully");
      return result;
    } catch (error) {
      console.error("Error completing onboarding:", error);
      throw error;
    }
  }
}

export const userProfileService = new UserProfileService();
