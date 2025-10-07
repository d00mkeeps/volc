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
      console.error("Sign-in error:", error);
      throw handleAuthError(error);
    }
  },

  signUp: async ({ email, password }: SignUpCredentials) => {
    try {
      console.log("🚀 [authService.signUp] Starting signup for:", email);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: "https://volc.uk/success",
        },
      });

      console.log("📦 [authService.signUp] Supabase response:", {
        hasData: !!data,
        hasError: !!error,
        user: data?.user?.id,
        session: !!data?.session,
      });

      if (error) {
        console.error("❌ [authService.signUp] Supabase error:", {
          message: error.message,
          status: error.status,
          name: error.name,
        });
        throw error;
      }

      // Check if user already exists (Supabase sometimes returns success with no session)
      if (data.user && !data.session && data.user.identities?.length === 0) {
        console.warn("⚠️ [authService.signUp] User already registered");
        throw {
          message:
            "An account with this email already exists. Please sign in instead.",
          status: 400,
        };
      }

      console.log("✅ [authService.signUp] Signup successful");
      return data;
    } catch (error: any) {
      console.error("💥 [authService.signUp] Caught error:", error);

      // Handle specific error cases
      if (error.message?.toLowerCase().includes("already registered")) {
        throw {
          message:
            "An account with this email already exists. Please sign in instead.",
          status: 400,
        };
      }

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
      console.log(
        "🔐 [authService.resetPassword] Sending reset email to:",
        email
      );

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "volc://reset-password",
      });

      if (error) {
        console.error("❌ [authService.resetPassword] Error:", error);
        throw error;
      }

      console.log("✅ [authService.resetPassword] Reset email sent");
    } catch (error) {
      console.error("💥 [authService.resetPassword] Caught error:", error);
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
  console.error("🔴 [handleAuthError] Processing error:", error);
  return {
    message: error.message || "An authentication error occurred",
    status: error.status,
  };
}
