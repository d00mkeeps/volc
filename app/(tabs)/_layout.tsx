import { Tabs } from "expo-router";
import { Home, User, MessageCircle, Trophy } from "lucide-react";
import { useColorScheme } from "react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colorScheme === "dark" ? "#231f20" : "#ffffff",
          borderTopColor: "#f84f3e",
          borderTopWidth: 2,
          paddingBottom: 0,
          height: 60,
        },
        tabBarActiveTintColor: "#f84f3e",
        tabBarInactiveTintColor: colorScheme === "dark" ? "#6b6466" : "#999999",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          marginBottom: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: "Chats",
          tabBarIcon: ({ color, size }) => (
            <MessageCircle size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: "Leaderboard",
          tabBarIcon: ({ color, size }) => <Trophy size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
