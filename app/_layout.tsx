import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { useColorScheme, Linking } from "react-native";
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
import { UpdatePromptModal } from "@/components/molecules/UpdatePromptModal";
import {
  isVersionSupported,
  getCurrentAppVersion,
  MINIMUM_APP_VERSION,
  getAppStoreUrl,
} from "@/utils/versionCheck";
import Constants from "expo-constants";
import * as Facebook from "expo-facebook";
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

  Facebook.initializeAsync({
    appId: Constants.expoConfig?.extra?.metaAppId,
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
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // (/app/_layout.tsx.RootLayoutNav) - Check version on mount
  useEffect(() => {
    const checkVersion = () => {
      const isSupported = isVersionSupported();
      console.log("Version check:", {
        current: getCurrentAppVersion(),
        minimum: MINIMUM_APP_VERSION,
        supported: isSupported,
      });

      if (!isSupported) {
        setShowUpdateModal(true);
      }
    };

    checkVersion();
  }, []);

  // Monitor network quality

  const handleUpdate = async () => {
    const storeUrl = getAppStoreUrl();
    try {
      const supported = await Linking.canOpenURL(storeUrl);
      if (supported) {
        await Linking.openURL(storeUrl);
      } else {
        console.error("Cannot open store URL:", storeUrl);
      }
    } catch (error) {
      console.error("Failed to open store:", error);
    }
  };

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

              {/* Update Modal - now inside TamaguiProvider and Theme */}
              <UpdatePromptModal
                isVisible={showUpdateModal}
                currentVersion={getCurrentAppVersion()}
                minimumVersion={MINIMUM_APP_VERSION}
                onUpdate={handleUpdate}
              />
            </Theme>
          </TamaguiProvider>
          <Toast />
        </GestureHandlerRootView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
