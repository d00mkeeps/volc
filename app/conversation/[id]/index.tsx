import { ChatUI } from "@/components/conversation/organisms/ChatUI";
import { useMessage } from "@/context/MessageContext";
import { DataProvider } from "@/context/DataContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { ChatConfigKey } from "@/components/conversation/atoms/ConfigSelect";
import { releaseConnection } from "@/services/websocket/GlobalWebsocketService";

function ConversationPage() {
  const { id, pendingMessage } = useLocalSearchParams<{
    id: string;
    pendingMessage?: string;
  }>();

  // Get functions from MessageContext
  const {
    sendMessage,
    connectionState,
    getConversationConfig,
    loadConversation,
  } = useMessage();

  const router = useRouter();
  const initialMessageSent = useRef(false);
  const [configName, setConfigName] = useState<ChatConfigKey>("default");

  // Create stable function references with refs
  const loadConversationRef = useRef(loadConversation);
  const getConversationConfigRef = useRef(getConversationConfig);
  const sendMessageRef = useRef(sendMessage);

  // Add mount counter for debugging
  const mountCount = useRef(0);

  // Update function refs when they change
  useEffect(() => {
    loadConversationRef.current = loadConversation;
    getConversationConfigRef.current = getConversationConfig;
    sendMessageRef.current = sendMessage;
  }, [loadConversation, getConversationConfig, sendMessage]);

  // Debug effect to track mounting/unmounting
  useEffect(() => {
    mountCount.current++;
    console.log(`⚠️ ConversationPage MOUNTED #${mountCount.current}`);
    return () =>
      console.log(`⚠️ ConversationPage UNMOUNTED #${mountCount.current}`);
  }, []);

  // Effect to load conversation with minimal dependencies
  useEffect(() => {
    console.log(`🔄 Loading conversation: ${id}`);

    const initializeConversation = async () => {
      if (id) {
        try {
          // Use ref version of function
          await loadConversationRef.current(id);
          // Then set the config
          const config = getConversationConfigRef.current(id);
          console.log(`📋 Got config for conversation: ${config}`);
          setConfigName(config);
        } catch (error) {
          console.error("❌ Failed to initialize conversation:", error);
        }
      }
    };

    initializeConversation();
  }, [id]); // Only depends on id

  // Effect to send initial message with minimal dependencies
  useEffect(() => {
    if (!pendingMessage || !id || initialMessageSent.current) return;

    const canSend =
      connectionState.type === "CONNECTED" && connectionState.canSendMessage;

    console.log(
      `🔄 Initial message status: ${canSend ? "ready to send" : "waiting"}`
    );

    const sendInitialMessage = async () => {
      if (canSend) {
        try {
          await sendMessageRef.current(pendingMessage);
          initialMessageSent.current = true;
          router.setParams({ pendingMessage: undefined });
          console.log(`✅ Initial message sent`);
        } catch (error) {
          console.error("❌ Failed to send initial message:", error);
          initialMessageSent.current = false;
        }
      }
    };

    sendInitialMessage();
  }, [
    id,
    pendingMessage,
    connectionState.type,
    connectionState.canSendMessage,
    router,
  ]);

  // Cleanup effect to release connection on unmount
  useEffect(() => {
    return () => {
      if (id) {
        const config = getConversationConfigRef.current(id);
        console.log(`🧹 Releasing connection: ${config}:${id}`);
        releaseConnection(config, id);
      }
    };
  }, [id]);

  // Memoize DataProvider to prevent unnecessary remounts
  const dataProviderContent = useMemo(() => {
    if (!id) return null;

    console.log(`🔄 Creating DataProvider: ${id}, config: ${configName}`);

    return (
      <DataProvider conversationId={id}>
        <ChatUI
          configName={configName}
          conversationId={id}
          title="Trainsmart"
          subtitle="Chat to your AI coach today!"
          showNavigation={true}
        />
      </DataProvider>
    );
  }, [id, configName]); // Only depend on these props

  return <View style={styles.container}>{dataProviderContent}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1f281f",
  },
});

export default ConversationPage;
