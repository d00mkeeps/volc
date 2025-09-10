import { useState } from "react";
import { Stack, Spinner } from "tamagui";
import { useAuth } from "../../../context/AuthContext";
import Input from "@/components/atoms/Input";
import Button from "@/components/atoms/Button";
import Text from "@/components/atoms/Text";

export function SignInForm() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const cleanEmail = email.trim().toLowerCase().replace(/\s+/g, "");

    try {
      console.log("Submit button pressed, starting sign-in...");
      setLoading(true);
      const result = await signIn({ email: cleanEmail, password });
      console.log("Sign-in completed successfully:", result);
    } catch (error) {
      console.error("Sign-in form submission error:", error);
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack flex={1} position="relative">
      <Stack gap="$2" width="100%" paddingHorizontal="$4">
        <Input
          width="70%"
          height="$6"
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          backgroundColor="$backgroundStrong"
          borderRadius="$4"
          padding="$3"
          size="medium"
          borderWidth={1}
          borderColor="$borderSoft"
          color="$color"
          placeholderTextColor="$textMuted"
        />

        <Input
          width="70%"
          height="$6"
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          backgroundColor="$backgroundStrong"
          borderRadius="$4"
          padding="$3"
          size="medium"
          borderWidth={1}
          borderColor="$borderSoft"
          color="$color"
          placeholderTextColor="$textMuted"
        />
      </Stack>

      <Stack
        position="absolute"
        left={0}
        right={0}
        bottom="50%"
        paddingHorizontal="$4"
      >
        <Button onPress={handleSubmit} disabled={loading} width="30%">
          {loading ? (
            <Spinner color="white" />
          ) : (
            <Text color="white" size="medium" fontWeight="600">
              Sign In
            </Text>
          )}
        </Button>
      </Stack>
    </Stack>
  );
}
