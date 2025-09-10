import { useState, useEffect } from "react";
import { Stack, Spinner } from "tamagui";
import { useAuth } from "../../../context/AuthContext";
import Input from "@/components/atoms/Input";
import Button from "@/components/atoms/Button";
import Text from "@/components/atoms/Text";
import { SystemMessage } from "../../atoms/SystemMessage";

export function SignUpForm() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const clearForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  const clearPasswords = () => {
    setPassword("");
    setConfirmPassword("");
  };

  // Auto-clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleSubmit = async () => {
    const cleanEmail = email.trim().toLowerCase().replace(/\s+/g, "");
    if (password !== confirmPassword) {
      // Handle password mismatch
      return;
    }

    try {
      setLoading(true);
      setSuccess(false);
      await signUp({ email: cleanEmail, password });
      clearForm();
      setSuccess(true);
    } catch (error) {
      setSuccess(false);
      clearPasswords();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack flex={1} position="relative" paddingHorizontal="$4">
      {success && (
        <SystemMessage
          message="Account created! Please check your email to verify your account before signing in."
          type="success"
        />
      )}

      <Stack gap="$2" width="100%">
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

        <Input
          width="70%"
          height="$6"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm Password"
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
              Sign Up
            </Text>
          )}
        </Button>
      </Stack>
    </Stack>
  );
}
