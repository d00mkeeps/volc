import { type PostgrestError } from '@supabase/supabase-js';
import { UserOnboarding } from '@/types/onboarding';
import { BaseService } from './base';

function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'details' in error
  );
}

const AGE_GROUP_MAP = {
  '18-24': 1,
  '25-34': 2,
  '35-44': 3,
  '45-54': 4,
  '55-64': 5,
  '65+': 6,
} as const;

// services/onboarding.ts
export class UserProfileService extends BaseService {
    private mapAgeGroupToNumber(ageGroup: string): number {
        const mappedValue = AGE_GROUP_MAP[ageGroup as keyof typeof AGE_GROUP_MAP];
        if (!mappedValue) {
          throw new Error(`Invalid age group: ${ageGroup}`);
        }
        return mappedValue;
      }
    async saveUserProfile(summary: UserOnboarding) {
      try {
        const { data: { user }} = await this.supabase.auth.getUser();
        if (!user) throw new Error('No authenticated user found');
  
        const profileData = {
          first_name: summary.personalInfo.firstName,
          last_name: summary.personalInfo.lastName,
          is_imperial: summary.personalInfo.preferredUnits === 'imperial',
          goal: summary.goal,
          training_history: summary.fitnessBackground,
          age_group: this.mapAgeGroupToNumber(summary.personalInfo.ageGroup)
        };
  
        const { data, error } = await this.supabase
          .from('user_profiles')
          .update(profileData)
          .eq('auth_user_uuid', user.id)
          .select();
  
        if (error) throw error;
        return data;
      } catch (error) {
        if (isPostgrestError(error)) {
          console.error('Database error:', {
            code: error.code,
            message: error.message,
            details: error.details
          });
        }
        throw error;
      }
    }
  }