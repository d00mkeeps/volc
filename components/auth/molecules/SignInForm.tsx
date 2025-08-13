import { useState } from "react";
import { Stack } from "tamagui";
import { useAuth } from "../../../context/AuthContext";
import { AuthInput } from "../atoms/AuthInput";
import { AuthButton } from "../atoms/AuthButton";

export function SignInForm() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Clean email thoroughly
    const cleanEmail = email.trim().toLowerCase().replace(/\s+/g, "");

    try {
      console.log("Submit button pressed, starting sign-in...");
      setLoading(true);
      const result = await signIn({ email: cleanEmail, password }); // ← Use cleaned email
      console.log("Sign-in completed successfully:", result);
    } catch (error) {
      console.error("Sign-in form submission error:", error);
      setPassword(""); // ← Clear password on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack flex={1} position="relative">
      <Stack gap="$2">
        <AuthInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <AuthInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
        />
      </Stack>

      <Stack
        position="absolute"
        left={0}
        right={0}
        bottom="50%"
        paddingHorizontal="$4"
      >
        <AuthButton onPress={handleSubmit} loading={loading} title="Sign In" />
      </Stack>
    </Stack>
  );
}
