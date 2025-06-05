// app/(tabs)/profile.tsx
import React, { useState } from "react";
import { Stack, Text, Button } from "tamagui";
import { useWorkoutAnalysis } from "@/hooks/analysis/useWorkoutAnalysis";
import { useUserStore } from "@/stores/userProfileStore";
import { mockWorkout } from "@/mockdata";

export default function ProfileScreen() {
  const [testResult, setTestResult] = useState<string | null>(null);
  const { userProfile } = useUserStore();

  const {
    analyzeWorkout,
    isAnalyzing,
    analysisProgress,
    analysisResult,
    analysisError,
    resetAnalysis,
  } = useWorkoutAnalysis();

  const handleTestAnalysis = async () => {
    try {
      setTestResult("Starting analysis...");

      // Just pass the mock workout - store will handle user ID automatically
      await analyzeWorkout(mockWorkout, {
        onProgress: (progress) => {
          setTestResult(`Analysis progress: ${progress}%`);
        },
      });

      setTestResult("Analysis completed! Check result below.");
    } catch (err) {
      setTestResult(
        `Error: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  };

  const handleReset = () => {
    resetAnalysis();
    setTestResult(null);
  };

  return (
    <Stack flex={1} backgroundColor="$background">
      <Text fontSize="$6" color="$color" padding="$4" fontWeight="bold">
        Profile & Testing
      </Text>

      <Stack flex={1} paddingHorizontal="$4" gap="$4">
        {/* User Info Section */}
        <Stack backgroundColor="$backgroundSoft" padding="$3" borderRadius="$4">
          <Text fontSize="$5" fontWeight="600" marginBottom="$2">
            Current User
          </Text>
          <Text color="$colorPress">
            Display ID: {userProfile?.user_id?.toString() || "Not logged in"}
          </Text>
          <Text color="$colorPress">
            Auth UUID: {userProfile?.auth_user_uuid || "Not logged in"}
          </Text>
          <Text color="$colorPress">
            Name: {userProfile?.first_name || "Unknown"}
          </Text>
        </Stack>

        {/* Analysis Test Section */}
        <Stack
          backgroundColor="$backgroundSoft"
          padding="$3"
          borderRadius="$4"
          gap="$3"
        >
          <Text fontSize="$5" fontWeight="600">
            Workout Analysis Test
          </Text>

          <Text color="$colorPress" fontSize="$3">
            This will analyze historical data for: Barbell Bench Press, Dumbbell
            Shoulder Press, Push-ups, Tricep Dips, Treadmill Sprint Intervals
          </Text>

          <Stack flexDirection="row" gap="$2">
            <Button
              onPress={handleTestAnalysis}
              disabled={isAnalyzing || !userProfile?.auth_user_uuid}
              backgroundColor="$blue10"
              flex={1}
            >
              {isAnalyzing
                ? `Analyzing... ${analysisProgress}%`
                : "Test Workout Analysis"}
            </Button>

            <Button
              onPress={handleReset}
              disabled={isAnalyzing}
              backgroundColor="$gray8"
              variant="outlined"
            >
              Reset
            </Button>
          </Stack>

          {!userProfile?.auth_user_uuid && (
            <Text color="$red10" fontSize="$3">
              ⚠️ No authenticated user found. Please log in to test analysis.
            </Text>
          )}

          {/* Progress/Status Display */}
          {testResult && (
            <Stack backgroundColor="$background" padding="$2" borderRadius="$2">
              <Text color="$color" fontSize="$3">
                Status: {testResult}
              </Text>
            </Stack>
          )}

          {/* Error Display */}
          {analysisError && (
            <Stack backgroundColor="$red2" padding="$2" borderRadius="$2">
              <Text color="$red11" fontSize="$3" fontWeight="600">
                Error: {analysisError.message}
              </Text>
            </Stack>
          )}

          {/* Results Display */}
          {analysisResult && (
            <Stack
              backgroundColor="$green2"
              padding="$3"
              borderRadius="$2"
              maxHeight={300}
            >
              <Text
                color="$green11"
                fontSize="$4"
                fontWeight="600"
                marginBottom="$2"
              >
                Analysis Result:
              </Text>
              <Stack
                backgroundColor="$background"
                padding="$2"
                borderRadius="$2"
              >
                <Text color="$color" fontSize="$2" fontFamily="$mono">
                  {JSON.stringify(analysisResult, null, 2)}
                </Text>
              </Stack>
            </Stack>
          )}
        </Stack>

        {/* Mock Data Info */}
        <Stack backgroundColor="$backgroundSoft" padding="$3" borderRadius="$4">
          <Text fontSize="$4" fontWeight="600" marginBottom="$2">
            Mock Workout Info
          </Text>
          <Text color="$colorPress" fontSize="$3">
            Name: {mockWorkout.name}
          </Text>
          <Text color="$colorPress" fontSize="$3">
            Exercises: {mockWorkout.workout_exercises.length}
          </Text>
          <Text color="$colorPress" fontSize="$3">
            Uses current user's auth_user_uuid automatically
          </Text>
        </Stack>
      </Stack>
    </Stack>
  );
}
