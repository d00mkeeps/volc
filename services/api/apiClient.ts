import { getLocalIpAddress } from '@/utils/network';
import AsyncStorage from '@react-native-async-storage/async-storage';

// State variables for base URLs
let API_BASE_URL: string | null = null;
let WS_BASE_URL: string | null = null;

// Token storage keys
const AUTH_TOKEN_KEY = '@auth_token';

/**
 * Initialize the API client with the correct base URLs
 * Must be called before making any API requests
 */
export async function initializeApiClient(): Promise<void> {
  if (!API_BASE_URL) {
    try {
      const ipAddress = await getLocalIpAddress();
      API_BASE_URL = `http://${ipAddress}:8000`;
      WS_BASE_URL = `ws://${ipAddress}:8000`;
      console.log(`[apiClient] Initialized with base URL: ${API_BASE_URL}`);
    } catch (error) {
      console.error('[apiClient] Failed to initialize:', error);
      throw new Error('Failed to initialize API client: Could not resolve IP address');
    }
  }
}

/**
 * Get the current base URL for API requests
 */
export async function getApiBaseUrl(): Promise<string> {
  await initializeApiClient();
  return API_BASE_URL!;
}

/**
 * Get the current base URL for WebSocket connections
 */
export async function getWsBaseUrl(): Promise<string> {
  await initializeApiClient();
  return WS_BASE_URL!;
}

/**
 * Get the stored authentication token
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('[apiClient] Error retrieving auth token:', error);
    return null;
  }
}

/**
 * Save authentication token
 */
export async function saveAuthToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (error) {
    console.error('[apiClient] Error saving auth token:', error);
  }
}

/**
 * Clear authentication token (logout)
 */
export async function clearAuthToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('[apiClient] Error clearing auth token:', error);
  }
}

/**
 * Endpoints that don't require authentication
 */
const PUBLIC_ENDPOINTS = [
  '/auth/sign-in', 
  '/auth/sign-up', 
  '/auth/reset-password'
];

/**
 * Check if an endpoint requires authentication
 */
function requiresAuth(endpoint: string): boolean {
  return !PUBLIC_ENDPOINTS.some(publicEndpoint => 
    endpoint.startsWith(publicEndpoint)
  );
}

/**
 * Generic API request function with authentication
 * Handles both authenticated and unauthenticated requests
 */
export async function apiRequest<T = any>(
  endpoint: string, 
  options: RequestInit = {},
  retryCount: number = 3
): Promise<T> {
  try {
    // Ensure API client is initialized
    await initializeApiClient();
    
    // Normalize endpoint
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_BASE_URL}${normalizedEndpoint}`;
    
    console.log(`[apiClient] Request to: ${url}`);
    
    // Prepare headers
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Safely add any existing headers
      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          if (typeof value === 'string') {
            headers[key] = value;
          } else if (value !== undefined && value !== null) {
            headers[key] = String(value);
          }
        });
      }
    // Add authorization header if required
    if (requiresAuth(normalizedEndpoint)) {
      const token = await getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        console.warn('[apiClient] No auth token available for authenticated endpoint');
      }
    }
    
    // Make the request
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    // Handle response
    if (!response.ok) {
      // Try to parse error response
      let errorDetail: string;
      try {
        const errorJson = await response.json();
        errorDetail = errorJson.detail || errorJson.message || `HTTP error ${response.status}`;
      } catch {
        errorDetail = `API error: ${response.status} ${response.statusText}`;
      }
      
      throw new Error(errorDetail);
    }
    
    // Check for empty response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      
      // Handle auth responses - store token
      if (normalizedEndpoint === '/auth/sign-in' || normalizedEndpoint === '/auth/sign-up') {
        console.log('Auth response for token extraction:', JSON.stringify(data));
        if (data.session?.access_token) {
          console.log('Saving token from response');
          await saveAuthToken(data.session.access_token);
        } else {
          console.log('No token found in auth response');
          // Check for different response structure
          console.log('Response structure:', Object.keys(data));
          if (data.access_token) {
            console.log('Found token at root level');
            await saveAuthToken(data.access_token);
          }
        }
      }
      return data as T;
    } else {
      // Handle non-JSON responses
      return { success: true } as unknown as T;
    }
  } catch (error) {
    console.error(`[apiClient] Request failed: ${endpoint}`, error);
    
    // Handle retry logic
    if (retryCount > 0 && isRetryableError(error)) {
      console.log(`[apiClient] Retrying... (${retryCount} attempts left)`);
      
      // Exponential backoff
      const backoffDelay = 1000 * Math.pow(2, 3 - retryCount);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
      
      return apiRequest(endpoint, options, retryCount - 1);
    }
    
    throw error;
  }
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: any): boolean {
  // Network errors are retryable
  if (error instanceof TypeError && error.message.includes('network')) {
    return true;
  }
  
  // Server errors (5xx) are retryable
  if (error.message && error.message.includes('500')) {
    return true;
  }
  
  // Default to not retrying
  return false;
}

/**
 * Helper for GET requests
 */
export async function apiGet<T = any>(
  endpoint: string, 
  params: Record<string, any> = {}
): Promise<T> {
  // Convert params to query string
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  const url = queryString ? `${endpoint}?${queryString}` : endpoint;
  
  return apiRequest<T>(url, { method: 'GET' });
}

/**
 * Helper for POST requests
 */
export async function apiPost<T = any>(
  endpoint: string, 
  data: any
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Helper for PUT requests
 */
export async function apiPut<T = any>(
  endpoint: string, 
  data: any
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

/**
 * Helper for PATCH requests
 */
export async function apiPatch<T = any>(
  endpoint: string, 
  data: any
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

/**
 * Helper for DELETE requests
 */
export async function apiDelete<T = any>(
  endpoint: string
): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
}