import { createContext, useContext, useState, useEffect } from "react";
import { AuthState, AuthError, SignInCredentials } from "../types/auth";
import { authService } from "../services/supabase/auth";
import { supabase } from "@/lib/supabaseClient";
import {
  getWebSocketService,
  connectBase,
  cleanup,
} from "@/services/websocket/GlobalWebsocketService";

interface AuthContextType extends AuthState {
  signIn: typeof authService.signIn;
  signUp: typeof authService.signUp;
  signOut: () => Promise<void>;
  resetPassword: typeof authService.resetPassword;
  error: AuthError | null;
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
    authService
      .getSession()
      .then((session) => {
        setState((prev) => ({
          ...prev,
          session,
          user: session?.user ?? null,
          loading: false,
        }));

        // Connect WebSocket when user is authenticated
        if (session?.user) {
          connectBase(session.user.id);
        }
      })
      .catch((err) => setError(err));

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setState((prev) => ({
        ...prev,
        session,
        user: session?.user ?? null,
        loading: false,
      }));

      // Handle WebSocket connections based on auth events
      if (event === "SIGNED_IN" && session?.user) {
        connectBase(session.user.id);
      } else if (event === "SIGNED_OUT") {
        cleanup();
      }
    });

    return () => {
      subscription.unsubscribe();
      cleanup(); // Clean up WebSocket on unmount
    };
  }, []);

  const value = {
    ...state,
    error,
    signIn: async (credentials: SignInCredentials) => {
      // Add proper type here
      try {
        console.log("Starting sign-in process...");
        const result = await authService.signIn(credentials);
        console.log("Sign-in API call successful:", result);

        // IMPORTANT: Manually update the state after sign-in
        if (result && result.session) {
          console.log("Updating auth state with new session");

          setState({
            session: result.session,
            user: result.user,
            loading: false,
          });

          // Connect WebSocket if needed
          if (result.user) {
            connectBase(result.user.id);
          }
        } else {
          console.log("Sign-in successful but no session returned:", result);
        }

        return result;
      } catch (error) {
        console.error("Sign-in failed:", error);
        setError(error as AuthError); // Type cast the error
        throw error;
      }
    },
    signUp: authService.signUp,
    signOut: async () => {
      cleanup(); // Clean up WebSocket connections first
      return authService.signOut();
    },
    resetPassword: authService.resetPassword,
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
