import { useState, useEffect } from "react";
import { Stack, Spinner } from "tamagui";
import { useAuth } from "../../../context/AuthContext";
import Input from "@/components/atoms/core/Input";
import Button from "@/components/atoms/core/Button";
import Text from "@/components/atoms/core/Text";
import React from "react";

interface SignUpFormProps {
  onSwitchToSignIn: () => void;
}

export function SignUpForm({ onSwitchToSignIn }: SignUpFormProps) {
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

  // NEW: Switch to sign in after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false);
        onSwitchToSignIn();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, onSwitchToSignIn]);

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
      {/* NEW: Success state fully replaces the form */}
      {success ? (
        <Stack
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          justifyContent="center"
          alignItems="center"
          paddingHorizontal="$4"
          zIndex={10}
        >
          <Stack
            backgroundColor="$green10"
            borderRadius="$4"
            padding="$6"
            width="100%"
            alignItems="center"
          >
            <Text
              color="white"
              size="large"
              fontWeight="600"
              textAlign="center"
            >
              Account created!{"\n\n"}Please check your email to verify your
              account before signing in.
            </Text>
          </Stack>
        </Stack>
      ) : (
        <>
          {/* Original form inputs */}
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

          {/* Submit button - only shown when not in success state */}
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
        </>
      )}
    </Stack>
  );
}
