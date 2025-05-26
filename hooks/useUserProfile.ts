import { useEffect } from 'react';
import { useUserStore } from '@/stores/userProfileStore';

export const useUserProfile = () => {
  const { 
    userProfile, 
    loading, 
    error, 
    refreshProfile, 
    updateProfile 
  } = useUserStore();
  
  useEffect(() => {
    if (!userProfile && !loading && !error) {
      refreshProfile();
    }
  }, [userProfile, loading, error, refreshProfile]);
  
  return {
    userProfile,
    loading,
    error,
    refreshProfile,
    updateProfile,
  };
};