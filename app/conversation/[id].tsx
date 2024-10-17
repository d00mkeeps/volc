import ChatUI from '@/components/conversation/organisms/ChatUI';
import { useMessage } from '@/context/MessageContext';
import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';

export default function ConversationPage() {
  const { messages, isLoading, isStreaming, sendMessage } = useMessage();

  return (
    <>
      <Stack.Screen 
        options={{
          headerTitle: "Conversation",
          headerBackTitle: "Home",
        }} 
      />
      <View style={styles.container}>
        <ChatUI />
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