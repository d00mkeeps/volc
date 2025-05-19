// services/supabase/userProfile.ts
import { BaseService } from './base';
import { UserOnboarding } from '@/types/onboarding';
import { apiGet, apiPost } from '../api/core/apiClient';

const AGE_GROUP_MAP = {
  '18-24': 1,
  '25-34': 2,
  '35-44': 3,
  '45-54': 4,
  '55-64': 5,
  '65+': 6,
} as const;

export class UserProfileService extends BaseService {
  /**
   * Map an age group string to its corresponding number value
   * @private
   */
  private mapAgeGroupToNumber(ageGroup: string): number {
    const mappedValue = AGE_GROUP_MAP[ageGroup as keyof typeof AGE_GROUP_MAP];
    if (!mappedValue) {
      throw new Error(`Invalid age group: ${ageGroup}`);
    }
    return mappedValue;
  }

  /**
   * Save or update a user's profile information
   */
  async saveUserProfile(summary: UserOnboarding) {
    try {
      console.log('Saving user profile:', summary);
      
      // Call backend API to save user profile
      const data = await apiPost('/db/user-profile', summary);
      
      console.log('User profile saved successfully');
      return data;
    } catch (error) {
      console.error('Error saving user profile:', error);
      throw error;
    }
  }
  
  /**
   * Get the current user's profile information
   */
  async getUserProfile() {
    try {
      console.log('Getting user profile');
      
      // Call backend API to get user profile
      const data = await apiGet('/db/user-profile');
      
      console.log('User profile retrieved successfully');
      return data;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }
}

export const userProfileService = new UserProfileService();