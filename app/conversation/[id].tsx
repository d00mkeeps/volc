import React from 'react';
import ChatUI from '@/components/conversation/organisms/ChatUI';
import { MessageProvider } from '@/context/MessageContext';
import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';

export default function ConversationPage() {
  return (
    <MessageProvider>
      <Stack.Screen 
        options={{
          headerTitle: "Conversation",
          headerBackTitle: "Home",
        }} 
      />
      <View style={styles.container}>
        <ChatUI 
                  configName="default" 
                  />
      </View>
    </MessageProvider>
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