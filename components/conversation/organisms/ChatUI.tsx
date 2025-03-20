import { useMessage } from "@/context/MessageContext";
import { useAttachments } from "@/context/ChatAttachmentContext";
import { ChatUIProps } from "@/types/chat";
import React, { useRef, useEffect, useCallback, useState, useMemo, memo } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Keyboard, SafeAreaView, View, Text } from "react-native";
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
  showSidebar = true, // New prop with default value true
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

  // Only allow sidebar toggle if showSidebar is true
  const handleToggleSidebar = useCallback(() => {
    if (conversationId && showSidebar) {
      setIsSidebarOpen(prev => !prev);
    }
  }, [conversationId, showSidebar]);

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

  // Register signal handler
  useEffect(() => {
    // Create handler function
    const handler = (type: string, data: any) => {
      console.log('ChatUI: Handling signal:', { type, data });
      
      if (handleSignal) {
        handleSignal(type, data);
      }
      
      if (onSignal) {
        onSignal(type, data);
      }
    };
    
    console.log('ChatUI: Registering signal handler');
    registerMessageHandler(handler);
    
    return () => {
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

  // Load conversation if conversationId exists
  useEffect(() => {
    const loadConversationOnce = async () => {
      if (!hasConnectedRef.current && conversationId) {
        console.log(`ChatUI: Loading conversation ${conversationId}`);
        hasConnectedRef.current = true;
        try {
          await loadConversation(conversationId);
        } catch (error) {
          console.error(`ChatUI: Failed to load conversation ${conversationId}:`, error);
        }
      }
    };
    
    loadConversationOnce();
    
    return () => {
      hasConnectedRef.current = false;
    };
  }, [loadConversation, conversationId]);

  // Memoize sidebar to prevent unnecessary re-renders
  const sidebarComponent = useMemo(() => {
    // Don't show sidebar if showSidebar is false or no conversationId
    if (!conversationId || !showSidebar) return null;
    
    return (
      <Sidebar 
        isOpen={isSidebarOpen}
        conversationId={conversationId}
        detailedAnalysis={detailedAnalysis}
        onToggleAnalysis={handleToggleAnalysis}
      />
    );
  }, [isSidebarOpen, conversationId, detailedAnalysis, handleToggleAnalysis, showSidebar]);

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title={title || "Chat"} 
        subtitle={subtitle || ""}
        showNavigation={showNavigation}
        onToggleSidebar={showSidebar ? handleToggleSidebar : undefined}
        isSidebarOpen={showSidebar ? isSidebarOpen : false}
      />
         {connectionState.type !== 'CONNECTED' && (
      <View style={styles.connectionBanner}>
        <Text style={styles.connectionText}>
          {connectionState.type === 'CONNECTING' ? 'Connecting...' : 
           connectionState.type === 'ERROR' ? 'Connection error' : 'Offline'}
        </Text>
      </View>
    )}
      <View style={styles.contentContainer}>
        <MessageList 
          messages={messages}
          streamingMessage={streamingMessage}
          style={styles.messageList}
          configName={configName}
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
  },
  connectionBanner: {
    backgroundColor: '#FF9800',
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  connectionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});