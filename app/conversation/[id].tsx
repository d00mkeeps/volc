// [id].tsx
import React, { useEffect } from 'react';
import { ChatUI } from '@/components/conversation/organisms/ChatUI';
import { Stack, useLocalSearchParams } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useMessage } from '@/context/MessageContext';

export default function ConversationPage() {
  const { id, pendingMessage } = useLocalSearchParams<{ 
    id: string;
    pendingMessage?: string;
  }>();
  const { connect, sendMessage, connectionState } = useMessage();

  useEffect(() => {
    // If there's a pending message, wait for connection before sending
    if (pendingMessage && connectionState.type === 'CONNECTED') {
      sendMessage(pendingMessage);
    }
  }, [pendingMessage, connectionState.type]);

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerTitle: "Conversation",
          headerBackTitle: "Home",
        }} 
      />
      <ChatUI 
        configName="default"
        title="Trainsmart"
        subtitle="Chat to your AI coach today!"
      />
    </View>
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