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
import Toast from "react-native-toast-message";
import React from "react";
import { TamaguiProvider, Theme } from "@tamagui/core";
import config from "../tamagui.config";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-get-random-values";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { UpdatePromptModal } from "@/components/molecules/UpdatePromptModal";
import WelcomeBottomSheet from "@/components/molecules/auth/WelcomeBottomSheet";
import {
  isVersionSupported,
  getCurrentAppVersion,
  MINIMUM_APP_VERSION,
  getAppStoreUrl,
} from "@/utils/versionCheck";
export { ErrorBoundary } from "expo-router";
import { Settings } from "react-native-fbsdk-next";
import { useStoreInitializer } from "@/hooks/useStoreInitializer";

Settings.initializeSDK();

export const unstable_settings = {
  initialRouteName: "(drawer)",
};

SplashScreen.preventAutoHideAsync();

function AuthStoreManager({ children }: { children: React.ReactNode }) {
  useStoreInitializer();
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
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

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
  useEffect(() => {
    console.log("[_layout] showWelcome changed:", showWelcome);
  }, [showWelcome]);

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
                      <AuthGate onWelcomeNeeded={setShowWelcome}>
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

                  <WelcomeBottomSheet
                    isVisible={showWelcome}
                    onComplete={() => {
                      console.log("[_layout] onComplete called");
                      setShowWelcome(false);
                    }}
                  />
                </AuthProvider>
              </BottomSheetModalProvider>

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
