import { useEffect } from "react";
import { TouchableWithoutFeedback, Keyboard } from "react-native";
import { Stack } from "tamagui";
import { SignUpForm } from "../molecules/auth/SignUpForm";
import { SystemMessage } from "../atoms/core/SystemMessage";
import { useAuth } from "../../context/AuthContext";

export function AuthScreen() {
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

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <Stack flex={1} backgroundColor="$background" padding="$4">
        {error && <SystemMessage message={error.message} type="error" />}

        <Stack flex={1} justifyContent="center">
            <SignUpForm />
        </Stack>
      </Stack>
    </TouchableWithoutFeedback>
  );
}
