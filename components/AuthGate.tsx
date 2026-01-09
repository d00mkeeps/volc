import { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../context/AuthContext";
import { AuthScreen } from "./screens/AuthScreen";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/stores/authStore";

interface AuthGateProps {
  children: React.ReactNode;
  onWelcomeNeeded: (needed: boolean) => void;
}

export function AuthGate({ children, onWelcomeNeeded }: AuthGateProps) {
  const { user, loading } = useAuth();
  const [checkingProfile, setCheckingProfile] = useState(false);
  const storesInitialized = useAuthStore((state) => state.initialized);

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) {
        onWelcomeNeeded(false);
        return;
      }

      setCheckingProfile(true);
      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("first_name, dob")
          .eq("auth_user_uuid", user.id)
          .single();

        if (!error && data) {
          console.log("[AuthGate] Profile check:", data);

          if (!data.dob) {
            console.log("[AuthGate] Missing DOB -> Showing Welcome Sheet");
            onWelcomeNeeded(true);
          } else {
            console.log("[AuthGate] DOB exists -> Hiding Welcome Sheet");
            onWelcomeNeeded(false);
          }
        } else {
          console.log(
            "[AuthGate] Profile fetch error or no data:",
            error,
            data
          );
        }
      } catch (err) {
        console.error("Error checking profile:", err);
      } finally {
        setCheckingProfile(false);
      }
    };

    if (!loading && storesInitialized) {
      checkProfile();
    }
  }, [user, loading, storesInitialized, onWelcomeNeeded]);

  console.log(
    "AuthGate render - user:",
    user ? "exists" : "null",
    "loading:",
    loading,
    "storesInitialized:",
    storesInitialized
  );

  if (loading || checkingProfile || !storesInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <View style={{ flex: 1 }}>{children}</View>;
}
