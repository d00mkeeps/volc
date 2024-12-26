import { useMessage } from "@/context/MessageContext";
import { ChatUIProps } from "@/types/chat";
import { useRef, useEffect, useCallback, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Keyboard, SafeAreaView } from "react-native";
import Header from "../molecules/Header";
import InputArea from "../atoms/InputArea";
import MessageList from "../molecules/MessageList";

export const ChatUI: React.FC<ChatUIProps> = ({
  configName,
  conversationId,
  title,
  subtitle,
  onSignal,
  showNavigation,
}) => {
  const { 
    messages, 
    streamingMessage, 
    connectionState, 
    sendMessage,
    connect,
    registerMessageHandler
  } = useMessage();

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const hasConnectedRef = useRef(false);

  useEffect(() => {
    const keyboardDidShow = Keyboard.addListener('keyboardDidShow', () => {
      console.log('ChatUI: Keyboard shown');
      setKeyboardVisible(true);
    });

    const keyboardDidHide = Keyboard.addListener('keyboardDidHide', () => {
      console.log('ChatUI: Keyboard hidden');
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShow.remove();
      keyboardDidHide.remove();
    };
  }, []);
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
  
  const handleSendMessage = useCallback((message: string) => {
    sendMessage(message);
  }, [sendMessage]);

  return (
    <SafeAreaView style={styles.container}>
      <Header 
      title={title} 
      subtitle={subtitle}
      showNavigation={showNavigation} />
      <MessageList 
        messages={messages}
        streamingMessage={streamingMessage}
        style={styles.messageList}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.inputContainer}
      >
        <InputArea
          disabled={!connectionState.canSendMessage}
          onSendMessage={sendMessage}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f281f',
  },
  messageList: {
    flex: 1,
  },
  inputContainer: {
    width: '100%',
    backgroundColor: '#1f281f',
  }
});