import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WelcomeModal } from '@/components/welcomeModal/WelcomeModal';
import Toast from 'react-native-toast-message';
import ConversationList from '@/components/conversation/organisms/ConversationList';
import InputArea from '@/components/conversation/atoms/InputArea';

export default function HomeScreen() {
  const [openWelcomeModal, setOpenWelcomeModal] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const router = useRouter();
  const { openWelcomeModal: shouldOpenWelcomeModal } = useLocalSearchParams<{ openWelcomeModal?: string }>();

  useEffect(() => {
    if (shouldOpenWelcomeModal === 'true') {
      setOpenWelcomeModal(true);
      // Reset the parameter after opening the modal
      router.setParams({ openWelcomeModal: undefined });
    }
  }, [shouldOpenWelcomeModal]);

  const handleConversationPress = (id: string) => {
    setSelectedConversationId(id);
    // Navigate to the conversation page
    router.push(`/conversation/${id}`);
  };

  const handleNewMessage = (message: string) => {
    if (selectedConversationId) {
      console.log('New message for conversation', selectedConversationId, ':', message);
    } else {
      console.log('Creating new conversation with message:', message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Chats</Text>
      <Text style={styles.subtitle}>Send a message to start a new conversation</Text>
      <View style={styles.conversationContainer}>
        <ConversationList onConversationPress={handleConversationPress} />
      </View>
      <InputArea 
      isHomePage={true}
        onSendMessage={handleNewMessage} 
        draftMessage={''} 
        onDraftMessageChange={(draft: string) => {
          console.log('Draft message changed:', draft);
          
        }} 
      />
      <WelcomeModal isVisible={openWelcomeModal} onClose={() => setOpenWelcomeModal(false)} />
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 20,
    paddingHorizontal: 12,
    paddingTop: 12,
    backgroundColor: '#222',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'left',
    color: '#ddd',
    paddingLeft: 18,
    paddingBottom: 4
  },
  separator: {
    marginVertical: 20,
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  conversationContainer: {
    flex: 1,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "light",
    paddingLeft: 18,
    paddingBottom: 10,
    color: '#ddd'
  }
});