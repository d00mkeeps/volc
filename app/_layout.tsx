import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
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
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

export { ErrorBoundary } from "expo-router";

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
              <BottomSheetModalProvider>
                <AuthProvider>
                  <AuthStoreManager>
                    <ThemeProvider
                      value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
                    >
                      <AuthGate>
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
              </BottomSheetModalProvider>
            </Theme>
          </TamaguiProvider>
          <Toast />
        </GestureHandlerRootView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
