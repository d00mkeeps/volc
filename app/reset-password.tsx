import { useState, useEffect } from "react";
import { Stack, Spinner, YStack } from "tamagui";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "@/lib/supabaseClient";
import Input from "@/components/atoms/core/Input";
import Button from "@/components/atoms/core/Button";
import Text from "@/components/atoms/core/Text";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Extract token from URL params
  const accessToken = params.access_token as string;
  const type = params.type as string;

  useEffect(() => {
    console.log("🔐 [ResetPassword] Screen mounted with params:", {
      hasToken: !!accessToken,
      type,
    });

    if (!accessToken || type !== "recovery") {
      console.error("❌ [ResetPassword] Invalid or missing token");
      setError("Invalid reset link. Please request a new password reset.");
    }
  }, [accessToken, type]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        console.log("✅ [ResetPassword] Success timeout - navigating to root");
        router.replace("/");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleSubmit = async () => {
    // Validation
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!accessToken) {
      setError("Invalid reset link");
      return;
    }

    try {
      console.log("🚀 [ResetPassword] Updating password...");
      setLoading(true);
      setError(null);

      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        console.error("❌ [ResetPassword] Update failed:", updateError);
        throw updateError;
      }

      console.log("✅ [ResetPassword] Password updated successfully");
      setSuccess(true);
    } catch (err: any) {
      console.error("💥 [ResetPassword] Error:", err);
      setError(err.message || "Failed to reset password. Please try again.");
      setPassword("");
      setConfirmPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <YStack flex={1} backgroundColor="$background" padding="$4">
        {/* Success State */}
        {success ? (
          <Stack flex={1} justifyContent="center" alignItems="center">
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
                Password reset successful!{"\n\n"}Redirecting you to sign in...
              </Text>
            </Stack>
          </Stack>
        ) : (
          <>
            {/* Header */}
            <Stack marginTop="$8" marginBottom="$6">
              <Text size="xl" fontWeight="700" textAlign="center">
                Set New Password
              </Text>
              <Text
                size="medium"
                color="$textMuted"
                textAlign="center"
                marginTop="$2"
              >
                Choose a strong password for your account
              </Text>
            </Stack>

            {/* Error Message */}
            {error && (
              <Stack
                backgroundColor="#ffebee"
                padding="$3"
                borderRadius="$3"
                marginBottom="$4"
                borderWidth={1}
                borderColor="#ffcdd2"
              >
                <Text size="small" color="#c62828">
                  ❌ {error}
                </Text>
              </Stack>
            )}

            {/* Form */}
            <Stack gap="$4" width="100%">
              <Input
                width="100%"
                height="$6"
                value={password}
                onChangeText={setPassword}
                placeholder="New Password"
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
                width="100%"
                height="$6"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm New Password"
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

              <Button
                onPress={handleSubmit}
                disabled={loading || !accessToken}
                marginTop="$4"
              >
                {loading ? (
                  <Spinner color="white" />
                ) : (
                  <Text color="white" size="medium" fontWeight="600">
                    Reset Password
                  </Text>
                )}
              </Button>
            </Stack>
          </>
        )}
      </YStack>
    </SafeAreaView>
  );
}
