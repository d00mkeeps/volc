import AdminDashboard from "@/components/screens/AdminDashboard";
import { Stack } from "expo-router";

export default function AdminDashboardScreen() {
  return (
    <>
      <Stack.Screen 
        options={{ 
          title: "Admin Dashboard", 
          headerBackTitle: "Profile",
          headerShown: true,
        }} 
      />
      <AdminDashboard />
    </>
  );
}
