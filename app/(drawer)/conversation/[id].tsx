import { ChatUI } from "@/components/conversation/organisms/ChatUI";
import { useMessage } from "@/context/MessageContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useCallback, useEffect } from "react";
import { View, StyleSheet } from "react-native";

function ConversationPage() {
  const { id, pendingMessage } = useLocalSearchParams<{ 
    id: string;
    pendingMessage?: string;
  }>();
  const { sendMessage, connectionState } = useMessage();
  const router = useRouter();
  const hasSentPendingMessage = useRef(false);

  const handleSignal = useCallback((type: string, data: any) => {
    console.log('Conversation signal received:', { type, data });
  }, []);

  useEffect(() => {
    if (pendingMessage && connectionState.type === 'CONNECTED' && !hasSentPendingMessage.current) {
      hasSentPendingMessage.current = true;
      sendMessage(pendingMessage);
      router.setParams({ pendingMessage: undefined });
    }
  }, [pendingMessage, connectionState.type]);

  useEffect(() => {
    console.log('ConversationPage mounted');
    return () => {
      console.log('ConversationPage unmounted');
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
  );}
  
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f281f',
  },
});

export default ConversationPage