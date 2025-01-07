import { ChatUI } from "@/components/conversation/organisms/ChatUI";
import { useMessage } from "@/context/MessageContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";

function ConversationPage() {
  const { id, pendingMessage } = useLocalSearchParams<{ 
    id: string;
    pendingMessage?: string;
  }>();
  const { sendMessage, connectionState } = useMessage();
  const router = useRouter();
  const initialMessageSent = useRef(false);

  const handleSignal = useCallback((type: string, data: any) => {
    console.log('Conversation signal received:', { type, data });
  }, []);

  useEffect(() => {
    const sendInitialMessage = async () => {
      if (
        pendingMessage && 
        !initialMessageSent.current && 
        connectionState.type === 'CONNECTED' && 
        connectionState.canSendMessage
      ) {
        console.log('🚀 Sending initial message:', pendingMessage);
        try {
          await sendMessage(pendingMessage);
          initialMessageSent.current = true;
          router.setParams({ pendingMessage: undefined });
          console.log('✅ Initial message sent successfully');
        } catch (error) {
          console.error('❌ Failed to send initial message:', error);
          initialMessageSent.current = false;
        }
      }
    };

    sendInitialMessage();
  }, [connectionState, pendingMessage, sendMessage]);

  useEffect(() => {
    console.log('ConversationPage mounted');
    return () => {
      console.log('ConversationPage unmounted');
      initialMessageSent.current = false;
    };
  }, []);

  useEffect(() => {
    console.log('ConversationPage connection state:', connectionState.type);
  }, [connectionState.type]);

  return (
    <View style={styles.container}>
      <ChatUI 
        configName="default"
        conversationId={id}
        title="Trainsmart"
        subtitle="Chat to your AI coach today!"
        onSignal={handleSignal}
        showNavigation={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f281f',
  },
});
export default ConversationPage