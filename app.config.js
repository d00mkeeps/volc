const config = {
  expo: {
    owner: "d00mkeeps",
    name: "Volc",
    slug: "Volc",
    version: "1.6.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "volc", // ← Change this from "myapp" to "volc"
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/images/icon.png",
      resizeMode: "contain",
      backgroundColor: "#231f20"
    },
    // File: /app.config.js (or wherever this config lives)

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.d00mkeeps.Volc",
      minimumOSVersion: "15.1",
      infoPlist: {
        "ITSAppUsesNonExemptEncryption": false,
        "NSPhotoLibraryUsageDescription": "Volc needs access to your photo library to let you select profile pictures and workout photos.",
        "NSCameraUsageDescription": "Volc needs access to your camera to let you take profile pictures and workout photos.",
"NSUserTrackingUsageDescription": "This helps us measure the effectiveness of our advertising.",
        // ADD THIS:
        "NSAppTransportSecurity": {
          "NSExceptionDomains": {
            "supabase.co": {
              "NSIncludesSubdomains": true,
              "NSTemporaryExceptionAllowsInsecureHTTPLoads": false
            }
          }
        }
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.d00mkeeps.Volc",
      minSdkVersion: 24,
      compileSdkVersion: 35
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      "expo-font",
      "expo-web-browser",
      "expo-tracking-transparency",
      [
"react-native-fbsdk-next", {

"appID": "877598598033367",

"clientToken": "07a6783f37e47490f3fa17aa9e66089f",

"displayName": "Volc"}    ], ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {
        origin: false
      },
      eas: {
        "projectId": "a637c490-51f0-41e3-8208-37ed1ea09d97"
      },
      apiUrl: process.env.API_URL || "https://localhost:8000",

            "metaAppId": process.env.META_APP_ID
    },
    jsEngine: "hermes",
    newArchEnabled: true,
  }
}
export default config