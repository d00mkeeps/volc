import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { WelcomeModal } from '@/components/welcomeModal/WelcomeModal';
import Toast from 'react-native-toast-message';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from 'react-native-screens/lib/typescript/native-stack/types';
import ConversationList from '@/components/conversation/ConversationDisplay/ConversationList';
import InputArea from '@/components/conversation/InputArea';
import { mockConversations } from '@/components/conversation/mockData';

type RootStackParamList = {
  Home: { openWelcomeModal?: boolean };
  programs: undefined;
  // Add other screen names and their params here
};

// Define the navigation prop type
type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const [openWelcomeModal, setOpenWelcomeModal] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const route = useRoute<HomeScreenRouteProp>();

  useEffect(() => {
    if (route.params?.openWelcomeModal) {
      setOpenWelcomeModal(true);
      // Reset the parameter after opening the modal
      navigation.setParams({ openWelcomeModal: undefined });
    }
  }, [route.params?.openWelcomeModal]);

  const handleConversationPress = (id: string) => {
    setSelectedConversationId(id);
    // Here you would typically navigate to a detailed conversation view
    // For now, we'll just log the selected conversation
    console.log('Selected conversation:', mockConversations.find(c => c.id === id));
  };

  const handleNewMessage = (message: string) => {
    if (selectedConversationId) {
      // Here you would typically update the selected conversation with the new message
      console.log('New message for conversation', selectedConversationId, ':', message);
    } else {
      // Create a new conversation with this message
      console.log('Creating new conversation with message:', message);
      // You would typically add this new conversation to your state or database
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TrainSmart</Text>
      <View style={styles.separator} />
      <View style={styles.conversationContainer}>
        <ConversationList onConversationPress={handleConversationPress} />
      </View>
      <InputArea onSendMessage={handleNewMessage} />
      <WelcomeModal isVisible={openWelcomeModal} onClose={() => setOpenWelcomeModal(false)} />
      <Toast />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1f281f',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#8cd884',
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
});