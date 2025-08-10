// services/api/core/auth.ts
import { supabase } from "@/lib/supabaseClient";
import { AuthError, SignInCredentials, SignUpCredentials } from "@/types/auth";

export const authService = {
  signIn: async ({ email, password }: SignInCredentials) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      throw handleAuthError(error);
    }
  },

  signUp: async ({ email, password }: SignUpCredentials) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      throw handleAuthError(error);
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      throw handleAuthError(error);
    }
  },

  resetPassword: async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } catch (error) {
      throw handleAuthError(error);
    }
  },

  getSession: async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error("Get session error:", error);
      return null;
    }
  },
};

function handleAuthError(error: any): AuthError {
  console.error("Auth error:", error);
  return {
    message: error.message || "An authentication error occurred",
    status: error.status,
  };
}
