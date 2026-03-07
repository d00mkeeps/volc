import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../context/AuthContext";
import { AuthScreen } from "./screens/AuthScreen";
import { useAuthStore } from "@/stores/authStore";
import { useUserStore } from "@/stores/userProfileStore";

interface AuthGateProps {
  children: React.ReactNode;
  onWelcomeNeeded: (needed: boolean) => void;
}

export function AuthGate({ children, onWelcomeNeeded }: AuthGateProps) {
  const { user, loading } = useAuth();
  const storesInitialized = useAuthStore((state) => state.initialized);
  const userProfile = useUserStore((state) => state.userProfile);

  useEffect(() => {
    if (!loading && storesInitialized) {
      if (!user) {
        onWelcomeNeeded(false);
        return;
      }

      console.log("[AuthGate] Profile check from store:", userProfile);

      // If userProfile exists but missing dob, user needs onboarding
      if (userProfile && !userProfile.dob) {
        console.log("[AuthGate] Missing DOB -> Showing Welcome Sheet");
        onWelcomeNeeded(true);
      } else {
        console.log(
          "[AuthGate] DOB exists (or no profile data) -> Hiding Welcome Sheet",
        );
        onWelcomeNeeded(false);
      }
    }
  }, [user, loading, storesInitialized, userProfile, onWelcomeNeeded]);

  console.log(
    "AuthGate render - user:",
    user ? "exists" : "null",
    "loading:",
    loading,
    "storesInitialized:",
    storesInitialized,
  );

  if (loading || !storesInitialized) {
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
