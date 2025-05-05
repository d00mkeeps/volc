// ChatUI.tsx
import { useMessage } from "@/context/MessageContext";
import { useData } from "@/context/DataContext";
import { ChatUIProps } from "@/types/chat";
import React, { useEffect, useCallback, useState, useMemo, memo } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Keyboard,
  SafeAreaView,
  View,
  Text,
} from "react-native";
import Header from "../molecules/Header";
import InputArea from "../atoms/InputArea";
import MessageList from "../molecules/MessageList";
import { Sidebar } from "../molecules/Sidebar";
import { getWebSocketService } from "@/services/websocket/GlobalWebsocketService";
import { WebSocketMessage } from "@/types/websocket";

// Type guard function to check if a message is a signal message
export const isSignalMessage = (
  message: WebSocketMessage
): message is {
  type: "signal";
  data: { type: string; data: any };
} => {
  return (
    message.type === "signal" &&
    !!message.data &&
    typeof message.data === "object" &&
    "type" in message.data &&
    "data" in message.data
  );
};

export const ChatUI = memo(
  ({
    configName,
    conversationId,
    title,
    subtitle,
    onSignal, // Kept for backward compatibility
    showNavigation,
    showSidebar = true,
  }: ChatUIProps) => {
    const { messages, streamingMessage, connectionState, sendMessage } =
      useMessage();
    const { isLoading } = useData();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [detailedAnalysis, setDetailedAnalysis] = useState(false);
    const [hasPendingGraphs, setHasPendingGraphs] = useState(false);

    // Set up WebSocketService message handler for onSignal callback

    // In ChatUI.tsx
    useEffect(() => {
      if (!conversationId || !onSignal) return;

      console.log(
        `[ChatUI] Setting up WebSocket handler for conversation: ${conversationId}`
      );

      const webSocketService = getWebSocketService();
      const messageHandler = (message: WebSocketMessage) => {
        // Use the type guard function to check message structure
        if (isSignalMessage(message)) {
          console.log(`[ChatUI] Received signal of type: ${message.data.type}`);

          // Check for workout data bundle specifically
          if (message.data.type === "workout_data_bundle") {
            console.log(
              `[ChatUI] Received workout_data_bundle signal with ID: ${message.data.data.bundle_id}`
            );

            // Only set notification if sidebar is not already open
            if (!isSidebarOpen) {
              setHasPendingGraphs(true);
              console.log(`[ChatUI] Set hasPendingGraphs to true`);
            }
          }

          // Original handler for other signals
          onSignal(message.data.type, message.data.data);
        }
      };

      webSocketService.on("message", messageHandler);

      return () => {
        console.log(
          `[ChatUI] Removing WebSocket handler for conversation: ${conversationId}`
        );
        webSocketService.off("message", messageHandler);
      };
    }, [conversationId, onSignal, isSidebarOpen]);

    const handleToggleSidebar = useCallback(() => {
      if (conversationId && showSidebar) {
        setIsSidebarOpen((prev) => !prev);
        // Clear notification when opening sidebar
        if (!isSidebarOpen) {
          setHasPendingGraphs(false);
        }
      }
    }, [conversationId, showSidebar, isSidebarOpen]);

    const handleToggleAnalysis = useCallback((value: boolean) => {
      setDetailedAnalysis(value);
    }, []);

    const handleSendMessage = useCallback(
      async (message: string) => {
        try {
          await sendMessage(message, { detailedAnalysis });
          setDetailedAnalysis(false);
        } catch (error) {
          console.error("ChatUI: Failed to send message:", error);
        }
      },
      [sendMessage, detailedAnalysis]
    );

    // Keyboard event listeners
    useEffect(() => {
      const keyboardDidShow = Keyboard.addListener("keyboardDidShow", () => {
        setKeyboardVisible(true);
      });

      const keyboardDidHide = Keyboard.addListener("keyboardDidHide", () => {
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
    }, [
      isSidebarOpen,
      conversationId,
      detailedAnalysis,
      handleToggleAnalysis,
      showSidebar,
    ]);

    return (
      <SafeAreaView style={styles.container}>
        <Header
          title={title || "Chat"}
          subtitle={subtitle || ""}
          showNavigation={showNavigation}
          onToggleSidebar={showSidebar ? handleToggleSidebar : undefined}
          isSidebarOpen={showSidebar ? isSidebarOpen : false}
          hasNotification={hasPendingGraphs}
        />
        {connectionState.type !== "CONNECTED" && (
          <View style={styles.connectionBanner}>
            <Text style={styles.connectionText}>
              {connectionState.type === "CONNECTING"
                ? "Connecting..."
                : connectionState.type === "ERROR"
                ? "Connection error"
                : "Offline"}
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
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.inputContainer}
        >
          <InputArea
            disabled={!connectionState.canSendMessage}
            onSendMessage={handleSendMessage}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1f281f",
  },
  contentContainer: {
    flex: 1,
    position: "relative",
  },
  messageList: {
    flex: 1,
  },
  inputContainer: {
    width: "100%",
    backgroundColor: "#1f281f",
  },
  connectionBanner: {
    backgroundColor: "#FF9800",
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  connectionText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});
