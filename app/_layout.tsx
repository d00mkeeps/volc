import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { useColorScheme, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { AuthProvider } from "@/context/AuthContext";
import { AuthGate } from "@/components/AuthGate";
import { useAuthStore } from "@/stores/authStore";
import Toast from "react-native-toast-message";
import React from "react";
import { TamaguiProvider, Theme } from "@tamagui/core";
import config from "../tamagui.config";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-get-random-values";

export { ErrorBoundary } from "expo-router";

console.log("🎯 Layout debug:", {
  configExists: !!config,
  configTokens: !!config?.tokens,
  configThemes: !!config?.themes,
  isProduction: process.env.NODE_ENV === "production",
});
export const unstable_settings = {
  initialRouteName: "(drawer)",
};

SplashScreen.preventAutoHideAsync();

function AuthStoreManager({ children }: { children: React.ReactNode }) {
  useAuthStore();
  return children as React.ReactElement;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  const [supabaseStatus, setSupabaseStatus] = useState<{
    success: boolean;
    message: string;
    timestamp: string;
    error?: string;
    url?: string;
  } | null>(null);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <TamaguiProvider config={config}>
            <Theme name={colorScheme === "dark" ? "dark" : "light"}>
              <AuthProvider>
                <AuthStoreManager>
                  <ThemeProvider
                    value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
                  >
                    <AuthGate>
                      {supabaseStatus && (
                        <View
                          style={{
                            position: "absolute",
                            bottom: 40,
                            right: 10,
                            padding: 8,
                            borderRadius: 4,
                            backgroundColor: supabaseStatus.success
                              ? "rgba(248, 79, 62, 0.2)"
                              : "rgba(255, 0, 0, 0.2)",
                            zIndex: 9999,
                          }}
                        >
                          <Text
                            style={{
                              color: supabaseStatus.success
                                ? "#d4412f"
                                : "#721c24",
                              fontSize: 12,
                            }}
                          >
                            Supabase: {supabaseStatus.success ? "✓" : "✗"}{" "}
                            {supabaseStatus.message}
                            {supabaseStatus.url &&
                              `\nURL: ${supabaseStatus.url.substring(
                                0,
                                15
                              )}...`}
                            {supabaseStatus.error &&
                              `\nDetails: ${supabaseStatus.error}`}
                          </Text>
                        </View>
                      )}
                      <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="(tabs)" />
                        <Stack.Screen
                          name="modal"
                          options={{ presentation: "modal" }}
                        />
                      </Stack>
                    </AuthGate>
                  </ThemeProvider>
                </AuthStoreManager>
              </AuthProvider>
            </Theme>
          </TamaguiProvider>
          <Toast />
        </GestureHandlerRootView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
