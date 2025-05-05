import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { AuthScreen } from "./screens/AuthScreen";
import { AuthGateProps } from "@/types/auth";

export function AuthGate({ children }: AuthGateProps) {
  const { user, loading } = useAuth();

  console.log(
    "AuthGate render - user:",
    user ? "exists" : "null",
    "loading:",
    loading
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return user ? children : <AuthScreen />;
}
