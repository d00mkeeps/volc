import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Returns the local IP address or host of the development machine.
 * Dynamically resolves from the Expo packager host URI (e.g., your Mac's LAN IP),
 * or falls back to localhost for the iOS simulator (which works completely offline).
 */
export const getLocalIpAddress = async (): Promise<string> => {
  // Try to extract the host IP dynamically from Expo's bundler connection
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri;

  if (hostUri) {
    const ip = hostUri.split(":")[0];
    if (ip && ip !== "127.0.0.1") {
      // On iOS simulator, localhost is always supported and works even when offline with no Wi-Fi.
      // If we are on Android emulator, 10.0.2.2 maps to host localhost.
      if (Platform.OS === "android" && (ip === "localhost" || ip === "127.0.0.1")) {
        return "10.0.2.2";
      }
      return ip;
    }
  }

  // iOS Simulator maps localhost directly to macOS host loopback
  if (Platform.OS === "ios") {
    return "localhost";
  }

  // Android Emulator loopback
  if (Platform.OS === "android") {
    return "10.0.2.2";
  }

  return "localhost";
};

