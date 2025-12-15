/**
 * API Configuration
 * Centralized backend URL configuration using environment variables
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    OAUTH_GOOGLE: `${API_BASE_URL}/oauth2/authorization/google`,
    USER_ME: `${API_BASE_URL}/api/user/me`,
    USER_CHECK: `${API_BASE_URL}/api/user/check`,
    USER_LOGOUT: `${API_BASE_URL}/api/user/logout`,
  },
} as const;

/**
 * Helper function to build API URLs
 */
export function getApiUrl(endpoint: string): string {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
}

