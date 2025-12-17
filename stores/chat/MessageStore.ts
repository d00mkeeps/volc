import { create } from "zustand";
import { persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Message } from "@/types";

const EMPTY_MESSAGES: Message[] = [];

interface StreamingMessageState {
  conversationId: string;
  content: string;
  isComplete: boolean;
  isProcessing?: boolean;
}

interface MessageStoreState {
  // State only
  messages: Map<string, Message[]>;
  streamingMessages: Map<string, StreamingMessageState>;
  isLoading: boolean;
  error: Error | null;

  // Pure state mutations
  setBulkMessages: (messagesByConversation: Record<string, Message[]>) => void;
  addMessage: (conversationId: string, message: Message) => void;
  removeMessage: (conversationId: string, messageId: string) => void; // ← Add this line
  updateStreamingMessage: (conversationId: string, content: string) => void;
  completeStreamingMessage: (conversationId: string) => void;
  clearStreamingMessage: (conversationId: string) => void;
  setStreamingMessage: (
    conversationId: string,
    state: StreamingMessageState | null
  ) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  clearMessages: (conversationId: string) => void;
}

export const useMessageStore = create<MessageStoreState>()(
  persist(
    (set) => ({
      // Initial state
      messages: new Map(),
      streamingMessages: new Map(),
      isLoading: false,
      error: null,

      // Pure state mutations
      setBulkMessages: (messagesByConversation) => {
        set((state) => {
          const newMessages = new Map(state.messages);
          Object.entries(messagesByConversation).forEach(
            ([conversationId, msgs]) => {
              const sortedMessages = msgs.sort(
                (a, b) => a.conversation_sequence - b.conversation_sequence
              );
              newMessages.set(conversationId, sortedMessages);
            }
          );
          return { messages: newMessages };
        });
      },

      addMessage: (conversationId, message) => {
        set((state) => {
          const conversationMessages = state.messages.get(conversationId) || [];
          const newMessages = new Map(state.messages);
          newMessages.set(conversationId, [...conversationMessages, message]);
          return { messages: newMessages };
        });
      },
      removeMessage: (conversationId: string, messageId: string) => {
        set((state) => {
          const conversationMessages = state.messages.get(conversationId);
          if (!conversationMessages) return state;

          const updated = conversationMessages.filter(
            (m) => m.id !== messageId
          );
          const newMessages = new Map(state.messages);
          newMessages.set(conversationId, updated);

          return { messages: newMessages };
        });
      },

      updateStreamingMessage: (conversationId, content) => {
        set((state) => {
          const newStreamingMessages = new Map(state.streamingMessages);
          const existing = newStreamingMessages.get(conversationId);

          if (existing) {
            newStreamingMessages.set(conversationId, {
              ...existing,
              content: existing.content + content,
            });
          } else {
            newStreamingMessages.set(conversationId, {
              conversationId,
              content,
              isComplete: false,
            });
          }

          return { streamingMessages: newStreamingMessages };
        });
      },

      completeStreamingMessage: (conversationId) => {
        set((state) => {
          const streamingState = state.streamingMessages.get(conversationId);
          if (!streamingState) return {};

          // Add completed message to messages
          const aiMessage: Message = {
            id: `temp-ai-${Date.now()}`,
            conversation_id: conversationId,
            content: streamingState.content,
            sender: "assistant",
            conversation_sequence:
              (state.messages.get(conversationId)?.length || 0) + 1,
            timestamp: new Date(),
          };

          const conversationMessages = state.messages.get(conversationId) || [];
          const newMessages = new Map(state.messages);
          newMessages.set(conversationId, [...conversationMessages, aiMessage]);

          // Clear streaming state
          const newStreamingMessages = new Map(state.streamingMessages);
          newStreamingMessages.delete(conversationId);

          return {
            messages: newMessages,
            streamingMessages: newStreamingMessages,
          };
        });
      },

      clearStreamingMessage: (conversationId) => {
        set((state) => {
          const newStreamingMessages = new Map(state.streamingMessages);
          newStreamingMessages.delete(conversationId);
          return { streamingMessages: newStreamingMessages };
        });
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

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearMessages: (conversationId) => {
        set((state) => {
          const newMessages = new Map(state.messages);
          newMessages.set(conversationId, []);
          return { messages: newMessages };
        });
      },
    }),
    {
      name: "message-store",
      storage: {
        getItem: async (name: string) => {
          const str = await AsyncStorage.getItem(name);
          if (!str) return null;
          const { state } = JSON.parse(str);
          return {
            state: {
              ...state,
              messages: new Map(state.messages),
              streamingMessages: new Map(), // Don't persist streaming state
            },
          };
        },
        setItem: (name: string, value: any) => {
          const state = {
            ...value.state,
            messages: Array.from(value.state.messages.entries()),
            streamingMessages: [], // Don't persist streaming state
          };
          return AsyncStorage.setItem(name, JSON.stringify({ state }));
        },
        removeItem: AsyncStorage.removeItem,
      },
      partialize: (state) => ({
        messages: state.messages,
        // streamingMessage is transient, don't persist
      }),
    }
  )
);
