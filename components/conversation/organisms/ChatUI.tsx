import { useMessage } from "@/context/MessageContext";
import { useAttachments } from "@/context/ChatAttachmentContext";
import { ChatUIProps } from "@/types/chat";
import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Keyboard, SafeAreaView, View } from "react-native";
import Header from "../molecules/Header";
import InputArea from "../atoms/InputArea";
import MessageList from "../molecules/MessageList";
import { Sidebar } from "../molecules/Sidebar";

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
    loadConversation,
    registerMessageHandler
  } = useMessage();
  const { handleSignal } = useAttachments();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const hasConnectedRef = useRef(false);
  const [detailedAnalysis, setDetailedAnalysis] = useState(false)

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const handleToggleAnalysis = useCallback((value: boolean) => {
    setDetailedAnalysis(value);
  }, []);

  const handleSendMessage = useCallback(async (message: string) => {
    try {

      await sendMessage(message, { detailedAnalysis });
      console.log('ChatUI: sendMessage completed successfully');
      setDetailedAnalysis(false);
    } catch (error) {
      console.error('ChatUI: Failed to send message:', error);
    }
  }, [sendMessage, detailedAnalysis]);

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
    if (!hasConnectedRef.current && conversationId) {
      console.log(`ChatUI: Loading conversation ${conversationId}`);
      hasConnectedRef.current = true;
      loadConversation(conversationId);
    }
    
    return () => {
      hasConnectedRef.current = false;
    };
  }, [loadConversation, conversationId, connectionState.type]);

  const sidebarComponent = useMemo(() => {
    if (!conversationId) return null;
    
    return (
      <Sidebar 
        isOpen={isSidebarOpen}
        conversationId={conversationId}
        detailedAnalysis={detailedAnalysis}
        onToggleAnalysis={handleToggleAnalysis}
      />
    );
  }, [isSidebarOpen, conversationId, detailedAnalysis, handleToggleAnalysis]);

 // In ChatUI.tsx

useEffect(() => {
  console.log('ChatUI: Registering signal handler');
  const signalHandler = (type: string, data: any) => {
    console.log('ChatUI: Handling signal:', { type, data });
    
    // No need to explicitly connect bundles to messages
    // Instead, our MessageItem component will find matching bundles using original_query
    
    // Just pass the signal to the attachment handler
    handleSignal(type, data);
    
    if (onSignal) {
      onSignal(type, data);
    }
    
    // Optionally, trigger a component refresh when a graph bundle arrives
    if (type === 'workout_data_bundle' && data?.bundle_id) {
      // Could use a custom event or state update to notify components
      console.log('Graph bundle received:', data.bundle_id);
      // This is handled by MessageItem directly now
    }
  };

  registerMessageHandler(signalHandler);
  return () => {
    console.log('ChatUI: Unregistering signal handler');
    registerMessageHandler(null);
  };
}, [onSignal, registerMessageHandler, handleSignal]);

  if (!conversationId) {
    console.error('ChatUI: conversationId is required');
    return null; // Or render an error state
  }


  return (
    <SafeAreaView style={styles.container}>
    <Header 
      title={title} 
      subtitle={subtitle}
      showNavigation={showNavigation}
      onToggleSidebar={handleToggleSidebar}
      isSidebarOpen={isSidebarOpen}
    />
    <View style={styles.contentContainer}>
      <MessageList 
        messages={messages}
        streamingMessage={streamingMessage}
        style={styles.messageList}
      />
 {sidebarComponent}
    </View>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.inputContainer}
    >
      <InputArea
        disabled={!connectionState.canSendMessage}
        onSendMessage={handleSendMessage}
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
  contentContainer: {
    flex: 1,
    position: 'relative', 
  },
  messageList: {
    flex: 1,
  },
  inputContainer: {
    width: '100%',
    backgroundColor: '#1f281f',
  }
});