import { getAuthToken, saveAuthToken, apiRequest } from './apiClient';

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

export async function refreshToken(): Promise<string | null> {
  // Prevent multiple concurrent refresh requests
  if (isRefreshing) {
    return refreshPromise;
  }
  
  try {
    isRefreshing = true;
    refreshPromise = (async () => {
      try {
        // Get current token
        const currentToken = await getAuthToken();
        if (!currentToken) return null;
        
        // Call refresh endpoint
        const response = await apiRequest('/auth/refresh-token', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentToken}`
          }
        });
        
        if (response && response.access_token) {
          // Save the new token
          await saveAuthToken(response.access_token);
          return response.access_token;
        }
        return null;
      } catch (error) {
        console.error('Token refresh failed:', error);
        return null;
      }
    })();
    
    return await refreshPromise;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
}