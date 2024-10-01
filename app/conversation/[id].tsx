import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import ChatUI from '@/components/conversation/organisms/ChatUI';
import { mockConversations } from '@/assets/mockData';
import { Stack } from 'expo-router';

export default function ConversationPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [draftMessage, setDraftMessage] = useState('');

  // Find the conversation in mockData
  const conversation = mockConversations.find(c => c.id === id);

  const handleSendMessage = useCallback((message: string) => {
    // Here you would typically send the message to your backend
    console.log('Sending message:', message);
    // Clear the input
    setDraftMessage('');
  }, []);

  if (!conversation) {
    return <View style={styles.container}><Text>Conversation not found</Text></View>;
  }

  return (
    <>
      <Stack.Screen 
        options={{
          headerTitle: conversation.title,
          headerBackTitle: "Home",
        }} 
      />
      <View style={styles.container}>
        <ChatUI
          title={conversation.title}
          messages={conversation.messages || []}
          draftMessage={draftMessage}
          onSendMessage={handleSendMessage}
          onDraftMessageChange={undefined} subtitle={'attachments placeholder'}        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f281f',
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
});