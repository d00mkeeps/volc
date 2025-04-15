import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { useColorScheme, Text, View } from "react-native";
import { MessageProvider } from "@/context/MessageContext";
import { AuthProvider } from "@/context/AuthContext";
import { AuthGate } from "@/components/auth/AuthGate";
import { UserProvider } from "@/context/UserContext";
import Toast from "react-native-toast-message";
import React from "react";
import { WorkoutProvider } from "@/context/WorkoutContext";
import { supabase } from "@/lib/supabaseClient";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(drawer)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
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

  // In your RootLayoutNav function, modify the useEffect:

  return (
    <>
      <AuthProvider>
        <UserProvider>
          <WorkoutProvider>
            <MessageProvider>
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
                          ? "rgba(0, 255, 0, 0.2)"
                          : "rgba(255, 0, 0, 0.2)",
                        zIndex: 9999,
                      }}
                    >
                      <Text
                        style={{
                          color: supabaseStatus.success ? "#155724" : "#721c24",
                          fontSize: 12,
                        }}
                      >
                        Supabase: {supabaseStatus.success ? "✓" : "✗"}{" "}
                        {supabaseStatus.message}
                        {supabaseStatus.url &&
                          `\nURL: ${supabaseStatus.url.substring(0, 15)}...`}
                        {supabaseStatus.error &&
                          `\nDetails: ${supabaseStatus.error}`}
                      </Text>
                    </View>
                  )}
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen
                      name="conversation/[id]"
                      options={{
                        headerShown: true,
                        headerTitle: "Conversation",
                        headerBackTitle: "Home",
                        contentStyle: {
                          backgroundColor: "#1f281f",
                          flex: 1,
                        },
                        headerStyle: {
                          backgroundColor: "#1f281f",
                        },
                        animation: "slide_from_right",
                      }}
                      getId={({ params }: { params?: Record<string, any> }) => {
                        if (!params) return undefined;
                        return String(params.id);
                      }}
                    />
                    <Stack.Screen
                      name="modal"
                      options={{ presentation: "modal" }}
                    />
                  </Stack>
                </AuthGate>
              </ThemeProvider>
            </MessageProvider>
          </WorkoutProvider>
        </UserProvider>
      </AuthProvider>
      <Toast />
    </>
  );
}
