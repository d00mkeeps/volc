import { useMessage } from "@/context/MessageContext";
import { ChatConfigName } from "@/types/chat";
import { useRef, useEffect } from "react";
import { View, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import Header from "../molecules/Header";
import InputArea from "../atoms/InputArea";
import MessageList from "../molecules/MessageList";

interface ChatUIProps {
  configName: ChatConfigName;
  conversationId?: string;
  title: string;
  subtitle?: string;
  onSignal?: (type: string, data: any) => void;
}

export const ChatUI: React.FC<ChatUIProps> = ({
  configName,
  conversationId,
  title,
  subtitle,
  onSignal,
}) => {
  const { 
    messages, 
    streamingMessage, 
    connectionState, 
    sendMessage,
    connect,
    registerMessageHandler
  } = useMessage();

  const hasConnectedRef = useRef(false);

  // Handle initial connection
  useEffect(() => {
    if (!hasConnectedRef.current && connectionState.type !== 'CONNECTED') {
      console.log(`ChatUI: Initial connection for ${configName}`);
      hasConnectedRef.current = true;
      connect(configName, conversationId);
    }
    return () => {
      hasConnectedRef.current = false;
    };
  }, [connect, configName, conversationId, connectionState.type]);

  // Handle signal registration
  useEffect(() => {
    if (onSignal) {
      registerMessageHandler(onSignal);
    }
    return () => {
      registerMessageHandler(null);
    };
  }, [onSignal, registerMessageHandler]);

  return (
    <View style={styles.container}>
      <Header title={title} subtitle={subtitle} />
      
      <MessageList 
        messages={messages}
        streamingMessage={streamingMessage}
        style={styles.messageList}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <InputArea
          disabled={!connectionState.canSendMessage}
          onSendMessage={sendMessage}
        />
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f281f',
  },
  messageList: {
    flex: 1,
  }
});