// ChatUI.tsx
import { useMessage } from "@/context/MessageContext";
import { useData } from "@/context/DataContext";
import { ChatUIProps } from "@/types/chat";
import React, { useEffect, useCallback, useState, useMemo, memo } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Keyboard, SafeAreaView, View, Text } from "react-native";
import Header from "../molecules/Header";
import InputArea from "../atoms/InputArea";
import MessageList from "../molecules/MessageList";
import { Sidebar } from "../molecules/Sidebar";
import { getWebSocketService } from "@/services/websocket/GlobalWebsocketService";
import { WebSocketMessage } from "@/types/websocket";

// Type guard function to check if a message is a signal message
export const isSignalMessage = (message: WebSocketMessage): message is {
  type: 'signal';
  data: { type: string; data: any };
} => {
  return (
    message.type === 'signal' &&
    !!message.data &&
    typeof message.data === 'object' &&
    'type' in message.data &&
    'data' in message.data
  );
};

export const ChatUI = memo(({ 
  configName,
  conversationId,
  title,
  subtitle,
  onSignal, // Kept for backward compatibility
  showNavigation,
  showSidebar = true,
}: ChatUIProps) => {
  const { 
    messages, 
    streamingMessage, 
    connectionState, 
    sendMessage
  } = useMessage();
  const { isLoading } = useData();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [detailedAnalysis, setDetailedAnalysis] = useState(false);

  // Set up WebSocketService message handler for onSignal callback
  useEffect(() => {
    if (!conversationId || !onSignal) return;
    
    const webSocketService = getWebSocketService();
    const messageHandler = (message: WebSocketMessage) => {
      // Use the type guard function to check message structure
      if (isSignalMessage(message)) {
        // TypeScript now knows this is a signal with type and data properties
        onSignal(message.data.type, message.data.data);
      }
    };
    
    webSocketService.on('message', messageHandler);
    
    return () => {
      webSocketService.off('message', messageHandler);
    };
  }, [conversationId, onSignal]);

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
      setDetailedAnalysis(false);
    } catch (error) {
      console.error('ChatUI: Failed to send message:', error);
    }
  }, [sendMessage, detailedAnalysis]);

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
  
  const sidebarComponent = useMemo(() => {
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