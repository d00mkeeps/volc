import { useMessage } from "@/context/MessageContext";
import { useAttachments } from "@/context/ChatAttachmentContext";
import { ChatUIProps } from "@/types/chat";
import React, { useRef, useEffect, useCallback, useState, useMemo, memo } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Keyboard, SafeAreaView, View } from "react-native";
import Header from "../molecules/Header";
import InputArea from "../atoms/InputArea";
import MessageList from "../molecules/MessageList";
import { Sidebar } from "../molecules/Sidebar";

export const ChatUI = memo(({ 
  configName,
  conversationId,
  title,
  subtitle,
  onSignal,
  showNavigation,
}: ChatUIProps) => {
  const { 
    messages, 
    streamingMessage, 
    connectionState, 
    sendMessage,
    loadConversation,
    registerMessageHandler
  } = useMessage();
  const { handleSignal } = useAttachments();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const hasConnectedRef = useRef(false);
  const [detailedAnalysis, setDetailedAnalysis] = useState(false);
  const signalHandlerRef = useRef<((type: string, data: any) => void) | null>(null);

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

  // Memoize the signal handler to avoid recreating it on each render
  const createSignalHandler = useCallback(() => {
    if (!signalHandlerRef.current) {
      signalHandlerRef.current = (type: string, data: any) => {
        console.log('ChatUI: Handling signal:', { type, data });
        
        // Pass the signal to the attachment handler
        handleSignal(type, data);
        
        if (onSignal) {
          onSignal(type, data);
        }
        
        // Optionally, trigger a component refresh when a graph bundle arrives
        if (type === 'workout_data_bundle' && data?.bundle_id) {
          console.log('Graph bundle received:', data.bundle_id);
        }
      };
    }
    return signalHandlerRef.current;
  }, [handleSignal, onSignal]);

// Modified ChatUI.tsx signal handler effect
useEffect(() => {
  // Skip registration until the component is fully mounted and stable
  const timer = setTimeout(() => {
    console.log('ChatUI: Registering signal handler');
    const handler = (type: string, data: any) => {
      console.log('ChatUI: Handling signal:', { type, data });
      handleSignal(type, data);
      if (onSignal) onSignal(type, data);
    };
    
    registerMessageHandler(handler);
  }, 100); // Small delay to ensure stability
  
  return () => {
    clearTimeout(timer);
    console.log('ChatUI: Unregistering signal handler');
    registerMessageHandler(null);
  };
}, [handleSignal, onSignal, registerMessageHandler]);

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShow = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });

    const keyboardDidHide = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShow.remove();
      keyboardDidHide.remove();
    };
  }, []);

  // Load conversation once
  useEffect(() => {
    const loadConversationOnce = async () => {
      if (!hasConnectedRef.current && conversationId) {
        console.log(`ChatUI: Loading conversation ${conversationId}`);
        hasConnectedRef.current = true;
        await loadConversation(conversationId);
      }
    };
    
    loadConversationOnce();
    
    return () => {
      hasConnectedRef.current = false;
    };
  }, [loadConversation, conversationId]);

  // Memoize sidebar to prevent unnecessary re-renders
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

  // Early exit if no conversationId
  if (!conversationId) {
    console.error('ChatUI: conversationId is required');
    return null;
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
});

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