import { useEffect, useState } from "react";
import { View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { AuthScreen } from "./screens/AuthScreen";
import { useAuthStore } from "@/stores/authStore";
import { useUserStore } from "@/stores/userProfileStore";
import { SplashScreen } from "expo-router";

interface AuthGateProps {
  children: React.ReactNode;
  onWelcomeNeeded: (needed: boolean) => void;
}

export function AuthGate({ children, onWelcomeNeeded }: AuthGateProps) {
  const { user, loading } = useAuth();
  const storesInitialized = useAuthStore((state) => state.initialized);
  const userProfile = useUserStore((state) => state.userProfile);
  const [isProfileChecked, setIsProfileChecked] = useState(false);

  useEffect(() => {
    if (!loading && storesInitialized) {
      if (!user) {
        onWelcomeNeeded(false);
        setIsProfileChecked(true);
        setTimeout(() => SplashScreen.hideAsync(), 50);
        return;
      }

      console.log("[AuthGate] Profile check from store:", userProfile);

      // If userProfile exists but missing dob, user needs onboarding
      if (userProfile && !userProfile.dob) {
        console.log("[AuthGate] Missing DOB -> Showing Welcome Sheet");
        onWelcomeNeeded(true);
        setIsProfileChecked(true);
        // Delay hiding splash screen longer to cover the modal's slide-up animation
        setTimeout(() => SplashScreen.hideAsync(), 400);
      } else {
        console.log(
          "[AuthGate] DOB exists (or no profile data) -> Hiding Welcome Sheet",
        );
        onWelcomeNeeded(false);
        setIsProfileChecked(true);
        setTimeout(() => SplashScreen.hideAsync(), 50);
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
    "isProfileChecked:",
    isProfileChecked
  );

  // Return null instead of ActivityIndicator so Splash Screen remains visible
  if (loading || !storesInitialized || !isProfileChecked) {
    return null;
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <View style={{ flex: 1 }}>{children}</View>;
}
