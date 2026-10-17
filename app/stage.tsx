// app/stage.tsx
import React, { useEffect, useState, useRef } from "react";
import { View, ActivityIndicator } from "react-native";
import { YStack, XStack, useTheme } from "tamagui";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import Text from "@/components/atoms/core/Text";
import Button from "@/components/atoms/core/Button";
import { AppIcon } from "@/assets/icons/IconMap";
import { stagingService } from "@/services/api/stagingService";
import { useUserStore } from "@/stores/userProfileStore";

export default function StageIntakeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ text?: string; notes?: string }>();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const processedRef = useRef(false);

  const rawText = params.text || params.notes || "";

  useEffect(() => {
    async function processStaging() {
      if (processedRef.current) return;
      if (!rawText || !rawText.trim()) {
        setIsProcessing(false);
        setError("No workout notes were provided in the share link.");
        return;
      }

      try {
        processedRef.current = true;
        setIsProcessing(true);
        setError(null);

        Toast.show({
          type: "info",
          text1: "Staging Workout",
          text2: "Parsing shared notes with AI...",
          visibilityTime: 4000,
        });

        const userProfile = useUserStore.getState().userProfile;
        const isImperial = userProfile?.is_imperial ?? false;

        const staged = await stagingService.stageWorkout({
          raw_text: rawText.trim(),
          reference_timestamp: new Date().toISOString(),
          is_imperial: isImperial,
        });

        Toast.show({
          type: "success",
          text1: "Workout Parsed 🎉",
          text2: `Extracted ${staged.parsed_workout?.exercises?.length || 0} exercises`,
        });

        router.replace({
          pathname: "/stage-review" as any,
          params: {
            stagedId: staged.id,
          },
        });
      } catch (err: any) {
        console.error("[StageIntakeScreen] Staging error:", err);
        setIsProcessing(false);
        setError(err?.message || "Could not parse workout notes. Please try again.");
        Toast.show({
          type: "error",
          text1: "Staging Failed",
          text2: err?.message || "Could not parse workout notes.",
        });
      }
    }

    processStaging();
  }, [rawText]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.background.val,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      {isProcessing ? (
        <YStack alignItems="center" gap="$4">
          <ActivityIndicator size="large" color="#f84f3e" />
          <YStack alignItems="center" gap="$2">
            <Text size="large" fontWeight="700" color="$text">
              Staging Workout...
            </Text>
            <Text size="small" color="$textMuted" textAlign="center">
              Parsing shared notes with AI into exercises and sets
            </Text>
          </YStack>
        </YStack>
      ) : (
        <YStack alignItems="center" gap="$4" maxWidth={360}>
          <AppIcon name="AlertCircle" size={48} color="$red10" />
          <YStack alignItems="center" gap="$2">
            <Text size="large" fontWeight="700" color="$text" textAlign="center">
              Staging Failed
            </Text>
            <Text size="small" color="$textMuted" textAlign="center">
              {error}
            </Text>
          </YStack>

          <XStack gap="$3" marginTop="$2">
            <Button
              size="$3"
              backgroundColor="$backgroundHover"
              onPress={() => router.replace("/(tabs)")}
            >
              <Text size="small" fontWeight="600" color="$text">
                Go to Home
              </Text>
            </Button>
            {rawText ? (
              <Button
                size="$3"
                backgroundColor="$accentColor"
                onPress={() => {
                  processedRef.current = false;
                  setIsProcessing(true);
                  setError(null);
                }}
              >
                <Text size="small" fontWeight="600" color="#ffffff">
                  Retry
                </Text>
              </Button>
            ) : null}
          </XStack>
        </YStack>
      )}
    </View>
  );
}
