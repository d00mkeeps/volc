// context/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from "react";
import {
  AuthState,
  AuthError,
  SignInCredentials,
  SignUpCredentials,
} from "../types/auth";
import { authService } from "../services/db/auth";
import { supabase } from "@/lib/supabaseClient";
import { Session, User } from "@supabase/supabase-js";
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

        // Connect WebSocket if user is logged in
        if (session?.user) {
          connectBase(session.user.id);
        }
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
      try {
        const result = await authService.signIn(credentials);
        return result;
      } catch (err) {
        setError(err as AuthError);
        throw err;
      }
    },
    signUp: async (credentials: SignUpCredentials) => {
      try {
        const result = await authService.signUp(credentials);
        return result;
      } catch (err) {
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
