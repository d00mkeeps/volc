import { createContext, useContext, useState, useEffect } from "react";
import {
  AuthState,
  AuthError,
  SignInCredentials,
  SignUpCredentials,
} from "../types/auth";
import { authService } from "../services/db/auth";
import { supabase } from "@/lib/supabaseClient";

interface AuthContextType extends AuthState {
  signIn: typeof authService.signIn;
  signInWithApple: typeof authService.signInWithIdToken;
  signUp: typeof authService.signUp;
  signOut: () => Promise<void>;
  resetPassword: typeof authService.resetPassword;
  error: AuthError | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    loading: true,
  });
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    // Initialize auth state
    const initializeAuthState = async () => {
      try {
        // Get the session directly from Supabase
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setState({
          session,
          user: session?.user ?? null,
          loading: false,
        });
      } catch (err) {
        console.error("Auth initialization error:", err);
        setState((prev) => ({ ...prev, loading: false }));
      }
    };

    initializeAuthState();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event);
      setState({
        session,
        user: session?.user ?? null,
        loading: false,
      });
    });

    // Handle deep links
    const handleDeepLink = async (url: string | null) => {
      if (!url) return;
      
      console.log("🔗 [AuthContext] Deep link received:", url);
      
      try {
        // Parse the URL to see if it contains auth tokens
        // Supabase magic links usually come as: volc://auth/callback#access_token=...&refresh_token=...
        // or volc://auth/callback?code=... (if using PKCE)
        
        // For implicit flow (hash fragment):
        if (url.includes("access_token") || url.includes("refresh_token")) {
            // We can't easily extract tokens manually without a library, 
            // but usually supabase.auth.getSession() might pick it up if we were in a browser.
            // In React Native, we might need to manually set the session if we extract tokens.
            
            // However, a better approach with Supabase v2 is often just letting the listener handle it 
            // IF we can pass the URL to supabase. But we disabled detectSessionInUrl.
            
            // Let's try to parse the hash
            const hashIndex = url.indexOf("#");
            if (hashIndex !== -1) {
                const hash = url.substring(hashIndex + 1);
                const params = new URLSearchParams(hash);
                const accessToken = params.get("access_token");
                const refreshToken = params.get("refresh_token");
                
                if (accessToken && refreshToken) {
                    const { data, error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });
                    if (error) throw error;
                    console.log("✅ [AuthContext] Session set from deep link");
                }
            }
        }
      } catch (error) {
        console.error("❌ [AuthContext] Error handling deep link:", error);
      }
    };

    // Check initial URL
    import("expo-linking").then((Linking) => {
        Linking.getInitialURL().then(handleDeepLink);
        const subscription = Linking.addEventListener("url", ({ url }) => handleDeepLink(url));
        return () => subscription.remove();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    ...state,
    error,
    clearError: () => setError(null),

    signIn: async (credentials: SignInCredentials) => {
      try {
        const result = await authService.signIn(credentials);
        return result;
      } catch (err) {
        setError(err as AuthError);
        throw err;
      }
    },

    signInWithApple: async (params: { token: string; nonce: string; fullName?: string | null }) => {
      try {
        const result = await authService.signInWithIdToken(params);
        return result;
      } catch (err) {
        setError(err as AuthError);
        throw err;
      }
    },

    signUp: async (credentials: SignUpCredentials) => {
      try {
        console.log("🚀 [AuthContext] SignUp called");
        const result = await authService.signUp(credentials);
        console.log("✅ [AuthContext] SignUp successful");
        return result;
      } catch (err) {
        console.error("❌ [AuthContext] SignUp error:", err);
        setError(err as AuthError);
        throw err;
      }
    },

    signOut: async () => {
      try {
        await authService.signOut();
      } catch (err) {
        setError(err as AuthError);
        throw err;
      }
    },

    resetPassword: async (email: string) => {
      try {
        await authService.resetPassword(email);
      } catch (err) {
        setError(err as AuthError);
        throw err;
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
