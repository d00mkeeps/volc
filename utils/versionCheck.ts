import * as Application from "expo-application";
import { Platform } from "react-native";

export const MINIMUM_APP_VERSION = "1.4.0";

/**
 * Compares two semantic version strings (e.g., "1.0.0", "1.1.0")
 * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split(".").map(Number);
  const parts2 = v2.split(".").map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 < part2) return -1;
    if (part1 > part2) return 1;
  }

  return 0;
}

import Constants, { ExecutionEnvironment } from "expo-constants";

/**
 * Gets the current native app version
 */
export function getCurrentAppVersion(): string | null {
  const version = Application.nativeApplicationVersion;
  // console.log(`📱 [VersionCheck] Detected native version: ${version}`);

  // Check if running in Expo Go
  const isExpoGo =
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  if (isExpoGo) {
    console.log(
      "⚠️ [VersionCheck] Running in Expo Go - version might be the client version, not the app version."
    );
  }

  return version;
}

/**
 * Checks if current app version meets minimum requirement
 */
export function isVersionSupported(): boolean {
  const currentVersion = getCurrentAppVersion();

  if (!currentVersion) {
    console.warn(
      "⚠️ [VersionCheck] Could not determine app version. Allowing access."
    );
    return true; // Allow access if version can't be determined
  }

  const comparison = compareVersions(currentVersion, MINIMUM_APP_VERSION);
  const isSupported = comparison >= 0;

  console.log(
    `🔍 [VersionCheck] Checking support: Current (${currentVersion}) >= Min (${MINIMUM_APP_VERSION})? ${
      isSupported ? "✅ YES" : "❌ NO"
    }`
  );

  return isSupported;
}

/**
 * Gets the app store URL for the current platform
 */
export function getAppStoreUrl(): string {
  if (Platform.OS === "ios") {
    // You'll need to replace this with your actual App Store ID once published
    return "https://apps.apple.com/gb/app/volc/id6751469055";
  } else {
    // Android Play Store
    return "https://play.google.com/store/apps/details?id=com.d00mkeeps.Volc";
  }
}
