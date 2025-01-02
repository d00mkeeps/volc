import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import WelcomeModal from '@/components/welcomeModal/WelcomeModal';
import Toast from 'react-native-toast-message';
import ConversationList from '@/components/conversation/organisms/ConversationList';
import InputArea from '@/components/conversation/atoms/InputArea';
import {useMessage} from '@/context/MessageContext'

export default function HomeScreen() {
  const { startNewConversation, currentConversationId } = useMessage();
  const [openWelcomeModal, setOpenWelcomeModal] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams<{ openWelcomeModal?: string }>();
  
  useEffect(() => {
    if (params.openWelcomeModal === 'true') {
      setOpenWelcomeModal(true);
      // Reset the parameter after opening the modal
      router.setParams({ openWelcomeModal: undefined });
    }
  }, [params.openWelcomeModal]);

  const handleConversationPress = (id: string) => {
    console.log(`Routing to conversation ${id}`);
    router.push({
      pathname: "/conversation/[id]",
      params: { id }
    });
  };
  
  const handleNewMessage = async (message: string) => {
    console.log('📮 handleNewMessage called:', { message });
    
    if (isCreatingConversation) {
      console.log('⚠️ Already creating conversation, returning');
      return;
    }
    
    try {
      setIsCreatingConversation(true)
      const newConversationId = await startNewConversation(message);
      console.log('🚗 Routing to new conversation:', newConversationId);

      router.push({
        pathname: "/(drawer)/conversation/[id]",
        params: { 
          id: newConversationId, 
        }
      });
      
    } catch (error) {
      console.error('❌ handleNewMessage failed:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to start conversation',
        text2: 'Please try again'
      });
    } finally {
      setTimeout(() => {
        setIsCreatingConversation(false);
      }, 2000); // Prevent rapid re-submissions
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
        onSendMessage={handleNewMessage}
        disabled={isCreatingConversation}
        useModal={true}
        modalTitle='Enter your workout!'
        customContainerStyle={{ backgroundColor: '#222'}}
      />
      <WelcomeModal 
        isVisible={openWelcomeModal} 
        onClose={() => setOpenWelcomeModal(false)} 
      />
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