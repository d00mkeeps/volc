import React, { useEffect, useRef } from 'react';
import { ChatUI } from '@/components/conversation/organisms/ChatUI';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useMessage } from '@/context/MessageContext';

export default function ConversationPage() {
  const { id, pendingMessage } = useLocalSearchParams<{ 
    id: string;
    pendingMessage?: string;
  }>();
  const { sendMessage, connectionState } = useMessage();
  const router = useRouter();
  const hasSentPendingMessage = useRef(false);

  useEffect(() => {
    // Only send if we have a pending message, are connected, and haven't sent it yet
    if (pendingMessage && connectionState.type === 'CONNECTED' && !hasSentPendingMessage.current) {
      hasSentPendingMessage.current = true;
      sendMessage(pendingMessage);
      
      // Clear the pending message from the URL
      router.setParams({ pendingMessage: undefined });
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