 import { ChatUI } from "@/components/conversation/organisms/ChatUI";
 import { useMessage } from "@/context/MessageContext";
 import { ChatAttachmentProvider } from "@/context/ChatAttachmentContext";
 import { useLocalSearchParams, useRouter } from "expo-router";
 import { useCallback, useEffect, useMemo, useRef, useState } from "react";
 import { View, StyleSheet } from "react-native";
import { ChatConfigKey } from "@/components/conversation/atoms/ConfigSelect";
 
function ConversationPage() {
  const { id, pendingMessage } = useLocalSearchParams<{ 
    id: string;
    pendingMessage?: string;
  }>();
  const { 
    sendMessage, 
    connectionState, 
    getConversationConfig,
    loadConversation 
  } = useMessage();
  const router = useRouter();
  const initialMessageSent = useRef(false);
  const [configName, setConfigName] = useState<ChatConfigKey>("default");
  
  // First effect loads the conversation and gets the config
  useEffect(() => {
    const initializeConversation = async () => {
      if (id) {
        try {
          // First load the conversation
          await loadConversation(id);
          // Then set the config (now it should be in the cache)
          setConfigName(getConversationConfig(id));
        } catch (error) {
          console.error("Failed to initialize conversation:", error);
        }
      }
    };
    
    initializeConversation();
  }, [id, loadConversation, getConversationConfig]);
  
  // Keep your existing pendingMessage effect
  useEffect(() => {
    const sendInitialMessage = async () => {
      if (
        pendingMessage && 
        !initialMessageSent.current && 
        connectionState.type === 'CONNECTED' && 
        connectionState.canSendMessage
      ) {
        try {
          await sendMessage(pendingMessage);
          initialMessageSent.current = true;
          router.setParams({ pendingMessage: undefined });
        } catch (error) {
          console.error('Failed to send initial message:', error);
          initialMessageSent.current = false;
        }
      }
    };

    sendInitialMessage();
  }, [connectionState, pendingMessage, sendMessage, router]);

  return (
    <View style={styles.container}>
      <ChatAttachmentProvider conversationId={id}>
        <ChatUI 
          configName={configName} // Now this is a state value that's initialized properly
          conversationId={id}
          title="Trainsmart"
          subtitle="Chat to your AI coach today!"
          showNavigation={true}
        />
      </ChatAttachmentProvider>
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