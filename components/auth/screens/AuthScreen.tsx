import { useState } from "react";
import { SafeAreaView } from "react-native";
import { Stack } from "tamagui";
import { SignInForm } from "../molecules/SignInForm";
import { SignUpForm } from "../molecules/SignUpForm";
import { AuthToggle } from "../atoms/AuthToggle";
import { AuthError } from "../atoms/AuthError";
import { useAuth } from "../../../context/AuthContext";
import { AuthMode } from "@/types/auth";

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>("signIn");
  const { error } = useAuth();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack flex={1} backgroundColor="$background" padding="$4">
        {error && <AuthError message={error.message} />}

        <Stack flex={1} paddingTop="30%">
          {mode === "signIn" ? <SignInForm /> : <SignUpForm />}
        </Stack>

        <Stack padding="$4" marginBottom="$4">
          <AuthToggle
            mode={mode}
            onToggle={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
          />
        </Stack>
      </Stack>
    </SafeAreaView>
  );
}
