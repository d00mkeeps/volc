import React from "react";
import { Stack, Text, ScrollView } from "tamagui";

export default function ConversationList() {
  return (
    <Stack flex={1}>
      <Text fontSize="$4" fontWeight="500" color="$text" marginBottom="$2">
        Recent Conversations
      </Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Stack gap="$2">
          <Stack
            height={60}
            backgroundColor="$backgroundSoft"
            borderRadius="$3"
          />
          <Stack
            height={60}
            backgroundColor="$backgroundSoft"
            borderRadius="$3"
          />
          <Stack
            height={60}
            backgroundColor="$backgroundSoft"
            borderRadius="$3"
          />
          <Stack
            height={60}
            backgroundColor="$backgroundSoft"
            borderRadius="$3"
          />
        </Stack>
      </ScrollView>
    </Stack>
  );
}
