/**
 * Development Credentials Configuration
 *
 * Used for automated and one-tap dev login in development builds (__DEV__).
 */
export const DEV_CONFIG = {
  // If true, automatically executes login on launch when unauthenticated in dev
  autoLogin: true,

  // Fallback dev credentials stored in codebase
  defaultCredentials: {
    email: "dev@volc.app",
    password: "password123",
  },
};
