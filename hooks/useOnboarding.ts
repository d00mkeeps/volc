import { useState, useCallback } from 'react';
import { UserProfileService } from '@/services/supabase/onboarding';
import type { UserOnboarding } from '@/types/onboarding';

const onboardingService = new UserProfileService();

export function useOnboarding() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const saveOnboarding = useCallback(async (data: UserOnboarding) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await onboardingService.saveUserProfile(data);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    saveOnboarding,
    isLoading,
    error
  };
}
