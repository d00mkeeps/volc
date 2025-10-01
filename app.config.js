const config = {
expo: {
owner: "d00mkeeps"
,name: "Volc",
slug: "Volc",
version: "1.1.0",
orientation: "portrait",
icon: "./assets/images/icon.png",
scheme: "myapp",
userInterfaceStyle: "automatic",
splash: {
image: "./assets/images/splash.png",
resizeMode: "contain",
backgroundColor: "#ffffff"
 },
 ios: {
    supportsTablet: true,
    bundleIdentifier: "com.d00mkeeps.Volc",
    minimumOSVersion: "15.1",
    infoPlist: {
      "ITSAppUsesNonExemptEncryption": false,
      "NSPhotoLibraryUsageDescription": "Volc needs access to your photo library to let you select profile pictures and workout photos.",
      "NSCameraUsageDescription": "Volc needs access to your camera to let you take profile pictures and workout photos."
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
    "expo-web-browser"
 ],
experiments: {
typedRoutes: true
 },
extra: {
router: {
origin: false
 },
eas: {
    "projectId": "a637c490-51f0-41e3-8208-37ed1ea09d97" },
apiUrl: process.env.API_URL || "https://localhost:8000",
 },
jsEngine: "hermes",
newArchEnabled: true,
 }
}
export default config