import { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../context/AuthContext";
import { AuthScreen } from "./screens/AuthScreen";
import { AuthGateProps } from "@/types/auth";
import { WelcomeBottomSheet } from "./molecules/auth/WelcomeBottomSheet";
import { supabase } from "@/lib/supabaseClient";

export function AuthGate({ children }: AuthGateProps) {
  const { user, loading } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(false);

  // Check if user has a name in their profile
  useEffect(() => {
    const checkProfile = async () => {
      if (!user) {
        setShowWelcome(false);
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
          // Show welcome sheet if DOB is missing (even if name exists)
          // This handles both new email signups (need name) and Apple signups (need DOB)
          if (!data.dob) {
            setShowWelcome(true);
          } else {
            setShowWelcome(false);
          }
        }
      } catch (err) {
        console.error("Error checking profile:", err);
      } finally {
        setCheckingProfile(false);
      }
    };

    if (!loading) {
      checkProfile();
    }
  }, [user, loading]);

  console.log(
    "AuthGate render - user:",
    user ? "exists" : "null",
    "loading:",
    loading
  );

  if (loading || checkingProfile) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <>
      {children}
      <WelcomeBottomSheet 
        isVisible={showWelcome} 
        onComplete={() => setShowWelcome(false)} 
      />
    </>
  );
}
