import { useState, useEffect } from "react";
import { Stack, Spinner } from "tamagui";
import { useAuth } from "../../../context/AuthContext";
import Input from "@/components/atoms/core/Input";
import Button from "@/components/atoms/core/Button";
import Text from "@/components/atoms/core/Text";
import React from "react";

interface ResetPasswordFormProps {
  onSwitchToSignIn: () => void;
}

export function ResetPasswordForm({
  onSwitchToSignIn,
}: ResetPasswordFormProps) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const clearForm = () => {
    setEmail("");
  };

  // Switch to sign in after 5 seconds
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

    if (!cleanEmail) {
      console.warn("⚠️ [ResetPasswordForm] Email is required");
      return;
    }

    try {
      console.log("🚀 [ResetPasswordForm] Requesting password reset...");
      setLoading(true);
      setSuccess(false);
      await resetPassword(cleanEmail);
      console.log("✅ [ResetPasswordForm] Reset email sent successfully");
      clearForm();
      setSuccess(true);
    } catch (error: any) {
      console.error("❌ [ResetPasswordForm] Reset failed:", error);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack flex={1} position="relative" paddingHorizontal="$4">
      {/* Success state */}
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
              Password reset email sent!{"\n\n"}Please check your email for
              instructions to reset your password. {"\n\n"}
              (Don't forget to check spam)
            </Text>
          </Stack>
        </Stack>
      ) : (
        <>
          {/* Form header */}
          <Stack marginBottom="$4">
            <Text size="large" fontWeight="600" textAlign="center">
              Reset Password
            </Text>
            <Text
              size="small"
              color="$textMuted"
              textAlign="center"
              marginTop="$2"
            >
              Enter your email and we'll send you a reset link
            </Text>
          </Stack>

          {/* Email input */}
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
          </Stack>

          {/* Submit button */}
          <Stack
            position="absolute"
            left={0}
            right={0}
            bottom="50%"
            paddingHorizontal="$4"
          >
            <Button
              onPress={handleSubmit}
              disabled={loading}
              width="35%"
              height="$4"
            >
              {loading ? (
                <Spinner color="white" />
              ) : (
                <Text color="white" size="medium" fontWeight="600">
                  Send Reset Link
                </Text>
              )}
            </Button>
          </Stack>
        </>
      )}
    </Stack>
  );
}
