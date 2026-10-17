import { useEffect, useState } from "react";
import { Stack, Spinner } from "tamagui";
import { useAuth } from "../../../context/AuthContext";
import Button from "@/components/atoms/core/Button";
import Text from "@/components/atoms/core/Text";
import Input from "@/components/atoms/core/Input";
import { Alert, Image } from "react-native";
import React from "react";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { supabase } from "@/lib/supabaseClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEV_CONFIG } from "@/constants/devCredentials";

const isDev = typeof __DEV__ !== "undefined" && __DEV__;
const VOLC_LOGO = isDev
  ? require("../../../assets/images/icon.png")
  : require("../../../assets/images/volc11.png");

interface SignUpFormProps {
  onSwitchToSignIn?: () => void; // Kept for compatibility but unused
}

export function SignUpForm({ onSwitchToSignIn }: SignUpFormProps) {
  const { signInWithApple } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showDobSheet, setShowDobSheet] = useState(false);
  const [dob, setDob] = useState<Date | null>(null);
  const [open, setOpen] = useState(false); // For Android/iOS picker visibility
  const [userId, setUserId] = useState<string | null>(null);
  const [showEmailAuth, setShowEmailAuth] = useState(false); // For dev email login
  const [email, setEmail] = useState(DEV_CONFIG.defaultCredentials.email);
  const [password, setPassword] = useState(DEV_CONFIG.defaultCredentials.password);
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between signin/signup

  // Pre-load last created/used dev credentials on mount & trigger auto-login if enabled
  useEffect(() => {
    if (!isDev) return;

    let isMounted = true;
    const initDevCredentials = async () => {
      try {
        const stored = await AsyncStorage.getItem("@volc_last_dev_credentials");
        let creds = DEV_CONFIG.defaultCredentials;
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.email && parsed.password) {
              creds = parsed;
            }
          } catch {}
        }
        if (isMounted) {
          setEmail(creds.email);
          setPassword(creds.password);
        }

        if (DEV_CONFIG.autoLogin && creds.email && creds.password) {
          console.log("⚡ [DevLogin] Attempting auto-login with:", creds.email);
          setLoading(true);
          let { error } = await supabase.auth.signInWithPassword({
            email: creds.email,
            password: creds.password,
          });
          if (error && creds.email !== DEV_CONFIG.defaultCredentials.email) {
            console.log("⚡ [DevLogin] Fallback to default credentials:", DEV_CONFIG.defaultCredentials.email);
            creds = DEV_CONFIG.defaultCredentials;
            if (isMounted) {
              setEmail(creds.email);
              setPassword(creds.password);
            }
            const retryRes = await supabase.auth.signInWithPassword({
              email: creds.email,
              password: creds.password,
            });
            error = retryRes.error;
          }
          if (error) {
            console.warn("⚠️ [DevLogin] Auto-login failed:", error.message);
          } else {
            console.log("✅ [DevLogin] Auto-login successful!");
            await AsyncStorage.setItem(
              "@volc_last_dev_credentials",
              JSON.stringify(creds)
            );
          }
          if (isMounted) {
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Failed to load dev credentials:", err);
      }
    };

    initDevCredentials();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleQuickDevLogin = async () => {
    let targetEmail = email;
    let targetPass = password;
    if (!targetEmail || !targetPass) {
      targetEmail = DEV_CONFIG.defaultCredentials.email;
      targetPass = DEV_CONFIG.defaultCredentials.password;
      setEmail(targetEmail);
      setPassword(targetPass);
    }
    try {
      setLoading(true);
      console.log("⚡ [QuickDevLogin] Signing in with:", targetEmail);
      let { error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: targetPass,
      });
      if (error && targetEmail !== DEV_CONFIG.defaultCredentials.email) {
        console.log("⚡ [QuickDevLogin] Retrying with default dev account:", DEV_CONFIG.defaultCredentials.email);
        targetEmail = DEV_CONFIG.defaultCredentials.email;
        targetPass = DEV_CONFIG.defaultCredentials.password;
        setEmail(targetEmail);
        setPassword(targetPass);
        const retry = await supabase.auth.signInWithPassword({
          email: targetEmail,
          password: targetPass,
        });
        error = retry.error;
      }
      if (error) throw error;
      await AsyncStorage.setItem(
        "@volc_last_dev_credentials",
        JSON.stringify({ email: targetEmail, password: targetPass })
      );
    } catch (e: any) {
      console.error("Quick Dev Login Error:", e);
      Alert.alert("Dev Login Failed", e.message || "Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      const nonce =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        nonce
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      const { identityToken, fullName } = credential;

      if (!identityToken) {
        throw new Error("No identity token provided");
      }

      // Format name if provided (only on first login)
      let nameString = null;
      if (fullName) {
        nameString = [fullName.givenName, fullName.familyName]
          .filter(Boolean)
          .join(" ");
      }

      const { user } = await signInWithApple({
        token: identityToken,
        nonce,
        fullName: nameString,
      });

      if (user) {
        setUserId(user.id);
        // Check if user has DOB
        const { data: profile, error } = await supabase
          .from("user_profiles")
          .select("dob")
          .eq("id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error checking profile:", error);
        }

        if (!profile?.dob) {
          setShowDobSheet(true);
        } else {
          // User has DOB, they are good to go.
          // AuthContext state change should trigger navigation in the parent/layout
        }
      }
    } catch (e: any) {
      if (e.code === "ERR_REQUEST_CANCELED") {
        // User canceled, do nothing
        return;
      }
      console.error("Apple Sign In Error:", e);
      Alert.alert("Sign In Failed", "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDobSubmit = async () => {
    if (!dob || !userId) return;

    // Validate Age (16+)
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    if (age < 16) {
      Alert.alert("Age Requirement", "You must be 16 or older to use Volc.");
      // Optionally sign them out here if you want to be strict
      return;
    }

    try {
      setLoading(true);
      const formattedDob = dob.toISOString().split("T")[0];

      const { error } = await supabase
        .from("user_profiles")
        .update({ dob: formattedDob })
        .eq("id", userId);

      if (error) throw error;

      // Success! Hide sheet. Navigation happens automatically via AuthContext state
      setShowDobSheet(false);
    } catch (error) {
      console.error("Error saving DOB:", error);
      Alert.alert("Error", "Failed to save date of birth. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert(
        "Missing Information",
        "Please enter both email and password."
      );
      return;
    }

    try {
      setLoading(true);

      if (isSignUp) {
        // Sign up with email
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: email.split("@")[0], // Use email prefix as default name
            },
          },
        });

        if (error) throw error;

        // Check if email confirmation is disabled (user is auto-confirmed)
        if (data.user && data.session) {
          if (isDev && email && password) {
            await AsyncStorage.setItem(
              "@volc_last_dev_credentials",
              JSON.stringify({ email, password })
            );
          }
          // User is auto-confirmed and signed in
          setUserId(data.user.id);
          // Check if user has DOB
          const { data: profile, error: profileError } = await supabase
            .from("user_profiles")
            .select("dob")
            .eq("auth_user_uuid", data.user.id)
            .single();

          if (profileError && profileError.code !== "PGRST116") {
            console.error("Error checking profile:", profileError);
          }

          if (!profile?.dob) {
            // Show DOB collection immediately after signup
            setShowDobSheet(true);
            setShowEmailAuth(false);
          }
          // Otherwise, navigation happens via AuthContext
        } else if (data.user && !data.session) {
          // Email confirmation is enabled, user needs to verify
          Alert.alert(
            "Check Your Email",
            `We've sent a verification link to ${email}. Please verify your email and then sign in.`,
            [
              {
                text: "OK",
                onPress: () => {
                  // Switch to sign in mode
                  setIsSignUp(false);
                  setPassword(""); // Clear password for security
                },
              },
            ]
          );
        }
      } else {
        // Sign in with email
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (isDev && email && password) {
          await AsyncStorage.setItem(
            "@volc_last_dev_credentials",
            JSON.stringify({ email, password })
          );
        }

        if (data.user) {
          setUserId(data.user.id);
          // Check if user has DOB (same flow as OAuth)
          const { data: profile, error: profileError } = await supabase
            .from("user_profiles")
            .select("dob")
            .eq("auth_user_uuid", data.user.id)
            .single();

          if (profileError && profileError.code !== "PGRST116") {
            console.error("Error checking profile:", profileError);
          }

          if (!profile?.dob) {
            // Show DOB collection on first sign in after email verification
            setShowDobSheet(true);
            setShowEmailAuth(false);
          }
          // Otherwise, navigation happens via AuthContext
        }
      }
    } catch (e: any) {
      console.error("Email Auth Error:", e);
      Alert.alert(
        isSignUp ? "Sign Up Failed" : "Sign In Failed",
        e.message || "Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack flex={1} padding="$2">
      {/* Main content area - centered */}
      <Stack flex={1} justifyContent="center" alignItems="center" gap="$4">
        <Image
          source={
            isDev
              ? require("../../../assets/images/icon.png")
              : require("../../../assets/images/volc11.png")
          }
          style={{ width: 300, height: 300 }}
          resizeMode="contain"
        />
        {/* Apple Sign In Button */}
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={12}
          style={{ width: "60%", height: 50 }}
          onPress={handleAppleSignIn}
        />

        {/* Dev Quick Login / Config - Only in Development */}
        {isDev && !showEmailAuth && (
          <Stack gap="$2" width="60%" marginTop="$2" alignItems="center">
            <Button
              onPress={handleQuickDevLogin}
              disabled={loading}
              backgroundColor="$orange9"
              borderRadius="$2"
              width="100%"
            >
              {loading ? (
                <Spinner color="white" />
              ) : (
                <Text color="white" fontWeight="600" numberOfLines={1}>
                  ⚡ Dev Login ({email || "Default"})
                </Text>
              )}
            </Button>
            <Button
              onPress={() => setShowEmailAuth(true)}
              disabled={loading}
              backgroundColor="transparent"
              size="$2"
            >
              <Text size="small" color="$textMuted">
                Change Dev Credentials
              </Text>
            </Button>
          </Stack>
        )}

        {/* Email Auth Forms */}
        {showEmailAuth && (
          <Stack width="100%" gap="$4" marginTop="$4">
            <Text size="medium" fontWeight="600" textAlign="center">
              {isSignUp ? "Sign Up with Email" : "Sign In with Email"}
            </Text>

            <Input
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Input
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <Button onPress={handleEmailAuth} disabled={loading}>
              {loading ? (
                <Spinner color="white" />
              ) : (
                <Text color="white" fontWeight="600">
                  {isSignUp ? "Sign Up" : "Sign In"}
                </Text>
              )}
            </Button>

            <Button
              onPress={() => setIsSignUp(!isSignUp)}
              backgroundColor="$backgroundStrong"
              disabled={loading}
            >
              <Text fontWeight="600">
                {isSignUp
                  ? "Already have an account? Sign In"
                  : "Need an account? Sign Up"}
              </Text>
            </Button>

            <Button
              onPress={() => {
                setShowEmailAuth(false);
              }}
              backgroundColor="$backgroundStrong"
              disabled={loading}
            >
              <Text fontWeight="600">← Back</Text>
            </Button>
          </Stack>
        )}
      </Stack>

      {/* Terms / Privacy - Now at absolute bottom */}
      <Stack paddingBottom="$4">
        <Text size="small" color="$textMuted" textAlign="center">
          By signing in, you agree to our Terms and Privacy Policy.
        </Text>
      </Stack>
    </Stack>
  );
}
