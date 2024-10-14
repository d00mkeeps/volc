import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import ChatUI from '@/components/conversation/organisms/ChatUI';
import { Stack } from 'expo-router';
import { useConversation } from '@/hooks/useConversation';
import { mockConversations } from '@/assets/mockData';


export default function ConversationPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [draftMessage, setDraftMessage] = useState('');
  
  const initialConversation = mockConversations.find(c => c.id === id) || {
    id: 'new',
    title: 'New Conversation',
    lastMessage: '',
    timestamp: new Date().toISOString(),
    lastMessageTime: new Date().toISOString(),
    messages: [],
  };
  
  const { conversation, sendMessage } = useConversation({ initialConversation });

  const handleSendMessage = useCallback((message: string) => {
    sendMessage(message, 'default'); // or any other config name
    setDraftMessage(''); // Clear draft message after sending
  }, [sendMessage]);

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
          messages={conversation.messages}
          draftMessage={draftMessage}
          onSendMessage={handleSendMessage}
          onDraftMessageChange={setDraftMessage}
          subtitle={'attachments placeholder'}
        />
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