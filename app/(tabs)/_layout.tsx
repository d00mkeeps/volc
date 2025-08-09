import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
// REMOVE these imports - authStore handles them now
// import { useEffect } from "react";
// import { useConversationStore } from "@/stores/chat/ConversationStore";
// import { useWorkoutStore } from "@/stores/workout/WorkoutStore";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  // REMOVE these - authStore handles them now
  // const { getConversations } = useConversationStore();
  // const { loadWorkouts } = useWorkoutStore();

  // REMOVE this entire useEffect - authStore handles initialization
  // useEffect(() => {
  //   getConversations();
  //   loadWorkouts();
  // }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
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
          tabBarInactiveTintColor:
            colorScheme === "dark" ? "#6b6466" : "#999999",
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
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="chats"
          options={{
            title: "Chats",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbubble-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="workouts"
          options={{
            title: "Leaderboard",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="podium-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
