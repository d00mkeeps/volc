import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import ConversationUI from '@/components/conversation/organisms/ChatUI';
import { mockConversations } from '@/assets/mockData';

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
    <View style={styles.container}>
      <ConversationUI
        title={conversation.title}
        subtitle={conversation.lastMessage}
        messages={conversation.messages || []}
        draftMessage={draftMessage}
        onSendMessage={handleSendMessage}
        onDraftMessageChange={undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f281f',
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
});