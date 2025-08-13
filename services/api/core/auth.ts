// services/api/core/auth.ts
import { supabase } from "@/lib/supabaseClient";
import { AuthError, SignInCredentials, SignUpCredentials } from "@/types/auth";

export const authService = {
  signUp: async ({ email, password }: SignUpCredentials) => {
    try {
      console.log("🚀 Starting signup process for:", email);
      console.log("📧 Email length:", email.length);
      console.log("🔐 Password length:", password.length);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      console.log(
        "📦 Raw Supabase response data:",
        JSON.stringify(data, null, 2)
      );
      console.log(
        "📦 Raw Supabase response error:",
        JSON.stringify(error, null, 2)
      );

      if (error) {
        console.error("❌ Supabase error details:", {
          name: error.name,
          message: error.message,
          status: error.status,
          // Remove the protected property access
        });
        throw error;
      }

      console.log("✅ Signup successful:", data);
      return data;
    } catch (error) {
      console.error("💥 Caught error in authService.signUp:", error);
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
