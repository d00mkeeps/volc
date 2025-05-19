// services/api/authService.ts
import { AuthError, SignInCredentials, SignUpCredentials } from '@/types/auth';
import { apiRequest } from './apiClient';

export const authService = {
  signIn: async ({ email, password }: SignInCredentials) => {
    try {
      const data = await apiRequest('/auth/sign-in', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      return data;
    } catch (error) {
      throw handleAuthError(error);
    }
  },
  
  signUp: async ({ email, password }: SignUpCredentials) => {
    try {
      const data = await apiRequest('/auth/sign-up', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      return data;
    } catch (error) {
      throw handleAuthError(error);
    }
  },
  
  signOut: async () => {
    try {
      await apiRequest('/auth/sign-out', {
        method: 'POST'
      });
    } catch (error) {
      throw handleAuthError(error);
    }
  },
  
  resetPassword: async (email: string) => {
    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
    } catch (error) {
      throw handleAuthError(error);
    }
  },
  
  getSession: async () => {
    try {
      // The /auth/me endpoint will validate the token and return session data
      const userData = await apiRequest('/auth/me');
      return userData.session;
    } catch (error) {
      // For getSession, we'll handle errors quietly since this is often used
      // to check if a user is logged in
      console.error('Get session error:', error);
      return null;
    }
  }
};

function handleAuthError(error: any): AuthError {
  console.error('Auth error:', error);
  return {
    message: error.message || 'An authentication error occurred',
    status: error.status
  };
}