import React, { useCallback, useEffect, useRef } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useMessage } from '@/context/MessageContext';
import { ConversationChat } from '@/components/conversation/organisms/DefaultChat';

export default function ConversationPage() {
  const { id, pendingMessage } = useLocalSearchParams<{ 
    id: string;
    pendingMessage?: string;
  }>();
  const { sendMessage, connectionState } = useMessage();
  const router = useRouter();
  const hasSentPendingMessage = useRef(false);
  console.log('Page received ID:', id);
  // Handle any conversation-specific signals if needed
  const handleSignal = useCallback((type: string, data: any) => {
    // Handle any conversation-specific signals here
    console.log('Conversation signal received:', { type, data });
  }, []);

  useEffect(() => {
    if (pendingMessage && connectionState.type === 'CONNECTED' && !hasSentPendingMessage.current) {
      hasSentPendingMessage.current = true;
      sendMessage(pendingMessage);
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
      <ConversationChat 
        conversationId={id}
        onSignal={handleSignal}
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