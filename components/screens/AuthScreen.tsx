import { useState, useEffect } from "react";
import { TouchableWithoutFeedback, Keyboard } from "react-native";
import { Stack } from "tamagui";
import { SignInForm } from "../molecules/auth/SignInForm";
import { SignUpForm } from "../molecules/auth/SignUpForm";
import { ResetPasswordForm } from "../molecules/auth/ResetPasswordForm";
import { AuthToggle } from "../atoms/AuthToggle";
import { SystemMessage } from "../atoms/SystemMessage";
import { useAuth } from "../../context/AuthContext";
import { AuthMode } from "@/types/auth";
import Text from "@/components/atoms/core/Text";

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [showResetPassword, setShowResetPassword] = useState(false);
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

  const handleResetPasswordSuccess = () => {
    setShowResetPassword(false);
    setMode("signIn");
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <Stack flex={1} backgroundColor="$background" padding="$4">
        {error && <SystemMessage message={error.message} type="error" />}

        <Stack flex={1} paddingTop="30%">
          {showResetPassword ? (
            <ResetPasswordForm onSwitchToSignIn={handleResetPasswordSuccess} />
          ) : mode === "signIn" ? (
            <SignInForm />
          ) : (
            <SignUpForm onSwitchToSignIn={handleSignUpSuccess} />
          )}
        </Stack>

        <Stack padding="$4" marginBottom="$4" gap="$3">
          <AuthToggle
            mode={mode}
            onToggle={() => {
              setShowResetPassword(false);
              setMode(mode === "signIn" ? "signUp" : "signIn");
            }}
          />

          {/* Forgot password link - only show on sign in */}
          {mode === "signIn" && !showResetPassword && (
            <Stack
              onPress={() => setShowResetPassword(true)}
              cursor="pointer"
              alignItems="center"
            >
              <Text size="small" color="$blue10" fontWeight="500">
                Forgot password?
              </Text>
            </Stack>
          )}

          {/* Back to sign in link - show when in reset mode */}
          {showResetPassword && (
            <Stack
              onPress={() => setShowResetPassword(false)}
              cursor="pointer"
              alignItems="center"
            >
              <Text size="small" color="$blue10" fontWeight="500">
                Back to sign in
              </Text>
            </Stack>
          )}
        </Stack>
      </Stack>
    </TouchableWithoutFeedback>
  );
}
