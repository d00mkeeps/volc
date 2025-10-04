import { useState, useEffect } from "react";
import { TouchableWithoutFeedback, Keyboard } from "react-native";
import { Stack } from "tamagui";
import { SignInForm } from "../molecules/auth/SignInForm";
import { SignUpForm } from "../molecules/auth/SignUpForm";
import { AuthToggle } from "../atoms/AuthToggle";
import { SystemMessage } from "../atoms/SystemMessage";
import { useAuth } from "../../context/AuthContext";
import { AuthMode } from "@/types/auth";

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>("signIn");
  const { error, clearError } = useAuth();

  // Auto-clear error messages after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);
  const handleSignUpSuccess = () => {
    setMode("signIn");
  };
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <Stack flex={1} backgroundColor="$background" padding="$4">
        {error && <SystemMessage message={error.message} type="error" />}
        <Stack flex={1} paddingTop="30%">
          {mode === "signIn" ? (
            <SignInForm />
          ) : (
            <SignUpForm onSwitchToSignIn={handleSignUpSuccess} />
          )}
        </Stack>
        <Stack padding="$4" marginBottom="$4">
          <AuthToggle
            mode={mode}
            onToggle={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
          />
        </Stack>
      </Stack>
    </TouchableWithoutFeedback>
  );
}
