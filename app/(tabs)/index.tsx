import React from "react";
import { Stack, Button, Text } from "tamagui";
import Dashboard from "@/components/organisms/Dashboard";
import WorkoutList from "@/components/molecules/WorkoutList";
import ConversationList from "@/components/molecules/ConversationList";
import Header from "@/components/molecules/HomeScreenHeader";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const handleSettingsPress = () => {
    console.log("Settings pressed");
  };

  const handleCreateWorkout = () => {
    console.log("Create workout pressed");
  };

  const handleCreateConversation = () => {
    console.log("Create conversation pressed");
  };

  return (
    <Stack flex={1} backgroundColor="$background" padding="$4">
      <Header greeting="Welcome!" onSettingsPress={handleSettingsPress} />

      <Dashboard />

      <WorkoutList />

      {/* Conversation section with side buttons */}
      <Stack flex={1} flexDirection="row" gap="$3">
        {/* Conversation list - takes up most space */}
        <Stack flex={1}>
          <ConversationList />
        </Stack>

        {/* Full-height action buttons on the right */}
        <Stack width={100} gap="$3">
          <Button
            flex={1} // 👈 Add this - makes button take half the height
            backgroundColor="$primary"
            borderRadius="$4"
            pressStyle={{ backgroundColor: "$primaryLight" }}
            onPress={handleCreateWorkout}
          >
            <Stack alignItems="center" gap="$1">
              <Ionicons name="fitness-outline" size={20} color="white" />
              <Text
                color="white"
                fontSize="$2"
                fontWeight="500"
                textAlign="center"
              >
                Workout
              </Text>
            </Stack>
          </Button>

          <Button
            flex={1} // 👈 Add this - makes button take other half the height
            backgroundColor="$primary"
            borderRadius="$4"
            pressStyle={{ backgroundColor: "$primaryLight" }}
            onPress={handleCreateConversation}
          >
            <Stack alignItems="center" gap="$1">
              <Ionicons name="chatbubble-outline" size={20} color="white" />
              <Text
                color="white"
                fontSize="$2"
                fontWeight="500"
                textAlign="center"
              >
                Chat
              </Text>
            </Stack>
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}
