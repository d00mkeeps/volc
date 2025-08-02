import { create } from "zustand";
import { conversationService } from "../../services/db/conversation";
import { Message } from "@/types";
import { getWebSocketService } from "../../services/websocket/WebSocketService";
import { useWorkoutAnalysisStore } from "../analysis/WorkoutAnalysisStore";
import { useAnalysisBundleStore } from "../attachments/AnalysisBundleStore";
import { useConversationStore } from "./ConversationStore";
import Toast from "react-native-toast-message";

const EMPTY_MESSAGES: Message[] = [];

let conversationCounter = 0;
const conversationNumbers = new Map<string, number>();
const getConversationNumber = (conversationId: string): string => {
  if (!conversationNumbers.has(conversationId)) {
    conversationNumbers.set(conversationId, ++conversationCounter);
  }
  return `conversation ${conversationNumbers.get(conversationId)}`;
};

interface StreamingMessageState {
  conversationId: string;
  content: string;
  isComplete: boolean;
  isProcessing?: boolean;
}

interface MessageStoreState {
  // State
  messages: Map<string, Message[]>;
  streamingMessages: Map<string, StreamingMessageState>;
  isLoading: boolean;
  error: Error | null;

  // Core message operations
  getMessages: (conversationId: string) => Message[];
  getEmptyMessages: () => Message[];
  loadMessages: (conversationId: string) => Promise<Message[]>;
  addUserMessage: (conversationId: string, content: string) => Promise<Message>;
  addAssistantMessage: (
    conversationId: string,
    content: string
  ) => Promise<Message>;
  clearMessages: (conversationId: string) => void;

  getStreamingMessage: (conversationId: string) => StreamingMessageState | null;
  setStreamingMessage: (
    conversationId: string,
    state: StreamingMessageState | null
  ) => void;
  isConversationStreaming: (conversationId: string) => boolean;

  // Main orchestration method
  sendMessage: (
    conversationId: string,
    content: string,
    options?: { detailedAnalysis?: boolean }
  ) => Promise<void>;

  // Utility
  clearError: () => void;
}

export const useMessageStore = create<MessageStoreState>((set, get) => ({
  // Initial state
  messages: new Map(),
  streamingMessages: new Map(),
  isLoading: false,
  error: null,

  getEmptyMessages: () => EMPTY_MESSAGES,

  getMessages: (conversationId) => {
    const state = get();
    // 🛡️ CLEANED: Removed logging that was causing infinite loops
    if (!state.messages || !conversationId) {
      return EMPTY_MESSAGES;
    }

    return state.messages.get(conversationId) || EMPTY_MESSAGES;
  },

  getStreamingMessage: (conversationId) => {
    const state = get();
    if (!state.streamingMessages || !conversationId) {
      return null;
    }
    return state.streamingMessages.get(conversationId) || null;
  },

  setStreamingMessage: (conversationId, streamingState) => {
    set((state) => {
      const newStreamingMessages = new Map(state.streamingMessages);
      if (streamingState === null) {
        newStreamingMessages.delete(conversationId);
      } else {
        newStreamingMessages.set(conversationId, streamingState);
      }
      return { streamingMessages: newStreamingMessages };
    });
  },

  isConversationStreaming: (conversationId) => {
    const state = get();
    if (!state.streamingMessages || !conversationId) {
      return false;
    }
    const streamingState = state.streamingMessages.get(conversationId);
    return streamingState != null && !streamingState.isComplete;
  },

  // Load messages from database
  loadMessages: async (conversationId) => {
    try {
      set({ isLoading: true, error: null });

      const messages = await conversationService.getConversationMessages(
        conversationId
      );
      const sortedMessages = messages.sort(
        (a, b) => a.conversation_sequence - b.conversation_sequence
      );

      set((state) => {
        const newMessages = new Map(state.messages);
        newMessages.set(conversationId, sortedMessages);
        return { messages: newMessages, isLoading: false };
      });

      return sortedMessages;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      });
      throw error;
    }
  },

  // Add user message to database and state
  addUserMessage: async (conversationId, content) => {
    try {
      const message = await conversationService.saveMessage({
        conversationId,
        content,
        sender: "user",
      });

      set((state) => {
        const conversationMessages = state.messages.get(conversationId) || [];
        const newMessages = new Map(state.messages);
        newMessages.set(conversationId, [...conversationMessages, message]);
        return { messages: newMessages };
      });

      return message;
    } catch (error) {
      set({
        error: error instanceof Error ? error : new Error(String(error)),
      });
      throw error;
    }
  },

  // Add assistant message to database and state
  addAssistantMessage: async (conversationId, content) => {
    try {
      const message = await conversationService.saveMessage({
        conversationId,
        content,
        sender: "assistant",
      });

      set((state) => {
        const conversationMessages = state.messages.get(conversationId) || [];
        const newMessages = new Map(state.messages);
        newMessages.set(conversationId, [...conversationMessages, message]);
        return { messages: newMessages };
      });

      return message;
    } catch (error) {
      set({
        error: error instanceof Error ? error : new Error(String(error)),
      });
      throw error;
    }
  },

  clearMessages: (conversationId) => {
    set((state) => {
      const newMessages = new Map(state.messages);
      newMessages.set(conversationId, []);
      return { messages: newMessages };
    });
  },

  clearError: () => {
    set({ error: null });
  },

  sendMessage: async (conversationId, content, options = {}) => {
    try {
      // Add user message first
      await get().addUserMessage(conversationId, content);

      // Get conversation config
      const configName = await useConversationStore
        .getState()
        .getConversationConfig(conversationId);

      // Auto-gather all data
      const messages = get().getMessages(conversationId);
      const analysisResult = useWorkoutAnalysisStore.getState().getResult();
      const analysisBundles = useAnalysisBundleStore
        .getState()
        .getBundlesByConversation(conversationId);

      // Build complete payload
      const payload = {
        message: content,
        conversation_history: messages,
        analysis_bundle: analysisResult,
        analysis_bundles: analysisBundles,
        generate_graph: options.detailedAnalysis || false,
      };

      // Set up WebSocket handlers
      const webSocketService = getWebSocketService();
      const unsubscribeFunctions: (() => void)[] = [];

      // Content handler
      const contentHandler = (contentChunk: string) => {
        const currentStreaming = get().getStreamingMessage(conversationId);

        if (!currentStreaming) {
          get().setStreamingMessage(conversationId, {
            conversationId,
            content: contentChunk,
            isComplete: false,
          });
        } else {
          get().setStreamingMessage(conversationId, {
            ...currentStreaming,
            content: currentStreaming.content + contentChunk,
          });
        }
      };

      // Completion handler
      const completeHandler = async () => {
        const streamingState = get().getStreamingMessage(conversationId);

        if (
          streamingState &&
          !streamingState.isComplete &&
          !streamingState.isProcessing &&
          streamingState.content
        ) {
          // Mark as processing
          get().setStreamingMessage(conversationId, {
            ...streamingState,
            isProcessing: true,
          });

          try {
            // Save completed message
            await get().addAssistantMessage(
              conversationId,
              streamingState.content
            );

            // Clear streaming state
            get().setStreamingMessage(conversationId, null);
          } catch (error) {
            console.error("Error saving completed message:", error);
            get().setStreamingMessage(conversationId, null);

            Toast.show({
              type: "error",
              text1: "Save Error",
              text2: "Failed to save message",
            });
          }
        }

        // Cleanup handlers
        unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
      };

      // Termination handler
      const terminationHandler = (reason: string) => {
        const streamingState = get().getStreamingMessage(conversationId);

        if (streamingState && !streamingState.isComplete) {
          // Show appropriate toast
          const messages = {
            token_limit: "Response cut off due to length limits",
            length_limit: "Response cut off due to length limits",
            timeout: "Response timed out",
            connection_lost: "Connection lost during response",
          };

          Toast.show({
            type: "warning",
            text1: "Message Cut Off",
            text2:
              messages[reason as keyof typeof messages] ||
              "Response was interrupted",
          });

          // Save partial message with indicator
          if (streamingState.content.trim()) {
            const partialContent =
              streamingState.content + "\n\n*[Response was cut off]*";
            get()
              .addAssistantMessage(conversationId, partialContent)
              .catch(console.error);
          }

          // Clear streaming state
          get().setStreamingMessage(conversationId, null);
        }

        // Cleanup handlers
        unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
      };

      // Error handler
      const errorHandler = (error: Error) => {
        console.error("WebSocket error:", error);

        get().setStreamingMessage(conversationId, null);

        Toast.show({
          type: "error",
          text1: "Connection Error",
          text2: error.message || "WebSocket connection failed",
        });

        set({ error });

        // Cleanup handlers
        unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
      };

      // Register handlers
      unsubscribeFunctions.push(
        webSocketService.onMessage(contentHandler),
        webSocketService.onComplete(completeHandler),
        webSocketService.onTerminated(terminationHandler),
        webSocketService.onError(errorHandler)
      );

      // NEW: Use persistent connection
      await webSocketService.ensureConnection();
      webSocketService.sendMessage(payload);
    } catch (error) {
      console.error("Error sending message:", error);

      const errorMessage =
        error instanceof Error ? error : new Error(String(error));

      Toast.show({
        type: "error",
        text1: "Send Failed",
        text2: errorMessage.message,
      });

      set({ error: errorMessage });
      throw errorMessage;
    }
  },
}));
