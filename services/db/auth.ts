import { supabase } from "@/lib/supabaseClient";
import { AuthError, SignInCredentials, SignUpCredentials } from "@/types/auth";

export const authService = {
  signIn: async ({ email, password }: SignInCredentials) => {
    try {
      // Support for password-based sign in (legacy/alternative)
      if (password) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        return data;
      }
      
      // Magic link sign in
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: "volc://auth/callback",
        },
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Sign-in error:", error);
      throw handleAuthError(error);
    }
  },

  signInWithIdToken: async ({ token, nonce, fullName }: { token: string; nonce: string; fullName?: string | null }) => {
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token,
        nonce,
      });

      if (error) throw error;

      // If we have a full name (first sign in), update the user profile immediately
      if (fullName && data.user) {
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');

        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ 
            first_name: firstName,
            last_name: lastName
          })
          .eq('auth_user_uuid', data.user.id);
          
        if (updateError) {
          console.error("Error saving full name:", updateError);
          // Don't fail auth if name save fails, but log it
        }
      }

      return data;
    } catch (error) {
      console.error("Apple Sign-in error:", error);
      throw handleAuthError(error);
    }
  },

  signUp: async ({ email, dob }: SignUpCredentials) => {
    try {
      console.log("🚀 [authService.signUp] Starting magic link signup for:", email);

      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: "volc://auth/callback",
          data: {
            dob: dob, // Pass DOB to be stored in user metadata
          },
        },
      });

      console.log("📦 [authService.signUp] Supabase response:", {
        hasData: !!data,
        hasError: !!error,
      });

      if (error) {
        console.error("❌ [authService.signUp] Supabase error:", error);
        throw error;
      }

      console.log("✅ [authService.signUp] Magic link sent");
      return data;
    } catch (error: any) {
      console.error("💥 [authService.signUp] Caught error:", error);
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
