import React from "react";
import { Stack, Text, ScrollView } from "tamagui";
import { useRouter } from "expo-router";
import ContentCard from "@/components/atoms/ContentCard";
import ViewMoreCard from "../atoms/ViewMoreCard";

interface ConversationListProps {
  limit?: number;
}

export default function ConversationList({ limit = 3 }: ConversationListProps) {
  const router = useRouter();

  // Mock data - replace with real data later
  const allConversations = [
    {
      id: "conv-1",
      title: "Workout Planning",
      subtitle:
        "Discussion about next week's training split and progression targets",
      date: new Date("2024-05-23"),
    },
    {
      id: "conv-2",
      title: "Nutrition Advice",
      subtitle: "Meal prep ideas and macro calculations for cutting phase",
      date: new Date("2024-05-22"),
    },
    {
      id: "conv-3",
      title: "Form Check",
      subtitle: "Video analysis of deadlift technique and mobility work",
      date: new Date("2024-05-21"),
    },
    {
      id: "conv-4",
      title: "Recovery Tips",
      subtitle: "Sleep optimization and active recovery strategies",
      date: new Date("2024-05-19"),
    },
  ];

  const displayedConversations = allConversations.slice(0, limit);
  const hasMore = allConversations.length > limit;

  const handleConversationPress = (conversationId: string) => {
    console.log("Open conversation:", conversationId);
    // TODO: Navigate to conversation detail or open modal
  };

  const handleViewAllPress = () => {
    //router.push('/conversations'); Navigate to dedicated conversations page
    console.log("Routing to /conversations!");
  };

  return (
    <Stack flex={1}>
      <Text fontSize="$4" fontWeight="500" color="$text" marginBottom="$2">
        Recent Conversations
      </Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Stack gap="$2">
          {displayedConversations.map((conversation) => (
            <ContentCard
              key={conversation.id}
              title={conversation.title}
              subtitle={conversation.subtitle}
              date={conversation.date}
              onPress={() => handleConversationPress(conversation.id)}
            />
          ))}
        </Stack>
      </ScrollView>
    </Stack>
  );
}
