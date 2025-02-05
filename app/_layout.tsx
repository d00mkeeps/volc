import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { MessageProvider } from '@/context/MessageContext';
import { AuthProvider } from '@/context/AuthContext';
import { AuthGate } from '@/components/auth/AuthGate';
import { UserProvider } from '@/context/UserContext';
import Toast from 'react-native-toast-message';
import React from 'react';
import { WorkoutProvider } from '@/context/WorkoutContext';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(drawer)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
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

  return (
    <>
      <AuthProvider>
        <UserProvider>
          <WorkoutProvider>
            <MessageProvider>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <AuthGate>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen 
  name="conversation/[id]"
  options={{
    headerShown: true,
    headerTitle: "Conversation",
    headerBackTitle: "Home",
    contentStyle: {
      backgroundColor: '#1f281f',
      flex: 1,
    },
    headerStyle: {
      backgroundColor: '#1f281f',
    },
    animation: 'slide_from_right',
  }}
  getId={({ params }: { params?: Record<string, any> }) => {
    if (!params) return undefined;
    return String(params.id);
  }}
/>
                    <Stack.Screen 
                      name="modal" 
                      options={{ presentation: 'modal' }} 
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