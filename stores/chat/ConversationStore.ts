import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { conversationService } from "../../services/db/conversation";
import { Conversation, ChatConfigName, QuickAction } from "@/types";
import { authService } from "@/services/db/auth";
import { useMessageStore } from "./MessageStore";
import { useUserStore } from "../userProfileStore";
import { apiGet, apiPost } from "@/services/api/core/apiClient";

interface ConversationStoreState {
  // State
  conversations: Map<string, Conversation>;
  activeConversationId: string | null;
  conversationConfigs: Map<string, ChatConfigName>;
  isLoading: boolean;
  error: Error | null;
  initialized: boolean;

  // Updated return type
  createConversationWithMessages: (
    messages: { content: string; sender: "user" | "assistant" }[]
  ) => Promise<{
    conversationId: string;
  }>;

  // Auth-triggered methods (called by authStore)
  initializeIfAuthenticated: () => Promise<void>;
  clearData: () => void;
  pendingInitialMessage: string | null;
  setPendingInitialMessage: (message: string | null) => void;
  pendingGreeting: string | null;
  setPendingGreeting: (greeting: string | null) => void;

  // Dynamic Actions

  suggestedActions: QuickAction[];
  isLoadingActions: boolean; // NEW
  setSuggestedActions: (actions: QuickAction[]) => void;
  fetchSuggestedActions: () => Promise<void>;

  // Core CRUD operations
  createConversation: (params: {
    title: string;
    firstMessage: string;
    configName: ChatConfigName;
  }) => Promise<string>;

  getConversation: (id: string) => Promise<Conversation>;
  getConversations: () => Promise<Conversation[]>;
  deleteConversation: (id: string) => Promise<void>;
  setActiveConversation: (id: string | null) => void;

  // Timeout & Resume
  checkTimeout: () => void;
  resumeConversation: (id: string) => void;
  touchConversation: (id: string) => void;

  // UI Coordination
  pendingChatOpen: boolean;
  setPendingChatOpen: (open: boolean) => void;

  // Utility methods
  clearError: () => void;
}

export const useConversationStore = create<ConversationStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      conversations: new Map(),
      activeConversationId: null,
      conversationConfigs: new Map(),
      isLoading: false,
      error: null,
      initialized: false,
      pendingInitialMessage: null,
      pendingGreeting: null,
      pendingChatOpen: false,
      suggestedActions: [], // Added suggestedActions to initial state
      isLoadingActions: false, // NEW

      setPendingChatOpen: (open) => set({ pendingChatOpen: open }),
      setPendingGreeting: (greeting) => set({ pendingGreeting: greeting }),
      setSuggestedActions: (actions) => set({ suggestedActions: actions }), // Added setSuggestedActions implementation

      fetchSuggestedActions: async () => {
        const userProfile = useUserStore.getState().userProfile;
        if (!userProfile?.auth_user_uuid) {
          console.log(
            "[ConversationStore] Cannot fetch actions: No auth user ID"
          );
          return;
        }

        // Get recent messages from active conversation
        const { activeConversationId } = get();
        let recentMessages: any[] = [];

        if (activeConversationId) {
          const messages = useMessageStore
            .getState()
            .messages.get(activeConversationId);
          if (messages && messages.length > 0) {
            // Format for backend: { sender: 'user' | 'assistant', content: string }
            // Taking last 10 messages for context
            recentMessages = messages.slice(-10).map((m) => ({
              sender: m.sender,
              content: m.content,
            }));
          }
        }

        console.log(
          `[ConversationStore] 🚀 Fetching suggested actions for user (UUID): ${userProfile.auth_user_uuid} with ${recentMessages.length} msgs`
        );

        set({ isLoadingActions: true }); // NEW

        try {
          // Changed to POST to send message context in body
          const response = await apiPost<{ actions: QuickAction[] }>(
            `/api/v1/chat/quick-actions/${userProfile.auth_user_uuid}`,
            recentMessages.length > 0 ? recentMessages : undefined
          );

          if (response && response.actions) {
            const formattedLog = response.actions
              .map((a, i) => `${i + 1}. [${a.label}]: ${a.message}`)
              .join("\n");

            // console.log(
            //   `[ConversationStore] Fetched quick replies:\n${formattedLog}`
            // );
            set({
              suggestedActions: response.actions,
              isLoadingActions: false,
            });
          } else {
            console.warn(
              "[ConversationStore] ⚠️ Received empty or invalid actions response:",
              response
            );
            set({ isLoadingActions: false });
          }
        } catch (error) {
          console.error(
            "[ConversationStore] ❌ Failed to fetch suggested actions:",
            error
          );
          set({ isLoadingActions: false });
        }
      },

      // In /stores/chat/ConversationStore.ts
      initializeIfAuthenticated: async () => {
        let attempts = 0;
        const maxAttempts = 50;
        let userProfile = useUserStore.getState().userProfile;
        let userStoreInitialized = useUserStore.getState().initialized;

        while (
          (!userProfile?.auth_user_uuid || !userStoreInitialized) &&
          attempts < maxAttempts
        ) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          userProfile = useUserStore.getState().userProfile;
          userStoreInitialized = useUserStore.getState().initialized;
          attempts++;
        }

        if (!userProfile?.auth_user_uuid) {
          return;
        }

        try {
          set({ isLoading: true, error: null });

          const result =
            await conversationService.getConversationsWithRecentMessages(
              userProfile.auth_user_uuid
            );
          const conversationsMap = new Map(
            result.conversations.map((conv) => [conv.id, conv])
          );

          useMessageStore.getState().setBulkMessages(result.messages);

          set({
            conversations: conversationsMap,
            isLoading: false,
            initialized: true,
          });

          // Fetch suggested actions after initialization
          await get().fetchSuggestedActions();
        } catch (error) {
          console.error("❌ ConversationStore: Initialization failed:", error);
          set({
            isLoading: false,
            initialized: true,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      },
      clearData: () => {
        set({
          conversations: new Map(),
          activeConversationId: null,
          conversationConfigs: new Map(),
          isLoading: false,
          error: null,
          initialized: false,
        });
      },

      createConversationWithMessages: async (messages) => {
        try {
          // No need to set pendingInitialMessage anymore as we create immediately
          set({ isLoading: true, error: null });

          const session = await authService.getSession();
          if (!session?.user?.id) {
            throw new Error("No authenticated user found");
          }

          const today = new Date();
          const dateStr = today.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });

          // Use first user message for title, or fallback to first message
          const userMsg = messages.find((m) => m.sender === "user")?.content;
          const titleMsg =
            userMsg || messages[0]?.content || "New Conversation";

          const messageSnippet =
            titleMsg.length > 30 ? `${titleMsg.slice(0, 30)}..` : titleMsg;
          const title = `${messageSnippet} | ${dateStr}`;

          const result =
            await conversationService.createConversationWithMessages({
              userId: session.user.id,
              title: title,
              messages: messages,
              configName: "workout-analysis",
            });

          set((state) => {
            const newConversations = new Map(state.conversations);
            newConversations.set(result.conversation.id, result.conversation);

            const newConfigs = new Map(state.conversationConfigs);
            newConfigs.set(result.conversation.id, "workout-analysis");

            return {
              conversations: newConversations,
              conversationConfigs: newConfigs,
              activeConversationId: result.conversation.id,
              isLoading: false,
            };
          });

          console.log(
            "✅ Conversation created with messages:",
            result.conversation.id
          );

          // Add created messages to MessageStore
          const { addMessage } = useMessageStore.getState();
          // We can't use addMessage directly for batch without triggering multiple updates?
          // Or just loop through them. They are already saved in DB.
          // The MessageStore needs to know about them.
          // Let's add them locally.

          // Note: result.messages is the array we sent, or returned from DB?
          // Service returns { conversation, messages: [] }.
          // Let's rely on what we sent + IDs if available, or just push.

          // Actually, we should probably fetch the messages or construct them.
          // Since we just created them, we know them.
          const now = new Date();

          // Clear current messages for this ID if any (should define new map entry)
          useMessageStore.getState().clearMessages(result.conversation.id);

          messages.forEach((msg, index) => {
            addMessage(result.conversation.id, {
              id: Math.random().toString(), // Temp ID until fetch? Or we should have got real IDs from backend?
              // Backend service currently returns user provided messages array.
              // We should probably rely on the fact that they ARE in DB.
              // Let's just add them.
              content: msg.content,
              sender: msg.sender,
              timestamp: now,
              conversation_id: result.conversation.id,
              conversation_sequence: index + 1,
            });
          });

          return {
            conversationId: result.conversation.id,
          };
        } catch (error) {
          console.error(
            "[ConversationStore] Error creating conversation with messages:",
            error
          );
          set({
            isLoading: false,
            error: error instanceof Error ? error : new Error(String(error)),
          });
          throw error;
        }
      },

      createConversation: async (params) => {
        try {
          set({ isLoading: true, error: null });

          const session = await authService.getSession();
          if (!session?.user?.id) {
            throw new Error("No authenticated user found");
          }

          const conversation = await conversationService.createConversation({
            userId: session.user.id,
            title: params.title,
            firstMessage: params.firstMessage,
            configName: params.configName,
          });

          set((state) => {
            const newConversations = new Map(state.conversations);
            newConversations.set(conversation.id, conversation);

            const newConfigs = new Map(state.conversationConfigs);
            newConfigs.set(conversation.id, params.configName);

            return {
              conversations: newConversations,
              conversationConfigs: newConfigs,
              activeConversationId: conversation.id,
              isLoading: false,
            };
          });

          return conversation.id;
        } catch (error) {
          console.error(
            "[ConversationStore] Error creating conversation:",
            error
          );
          set({
            isLoading: false,
            error: error instanceof Error ? error : new Error(String(error)),
          });
          throw error;
        }
      },

      setPendingInitialMessage: (message) => {
        set({ pendingInitialMessage: message });
      },

      getConversation: async (id) => {
        try {
          set({ isLoading: true, error: null });
          const conversation = await conversationService.getConversation(id);
          set((state) => {
            const newConversations = new Map(state.conversations);
            newConversations.set(conversation.id, conversation);
            if (conversation.config_name) {
              const newConfigs = new Map(state.conversationConfigs);
              newConfigs.set(
                conversation.id,
                conversation.config_name as ChatConfigName
              );
              return {
                conversations: newConversations,
                conversationConfigs: newConfigs,
                isLoading: false,
              };
            }
            return {
              conversations: newConversations,
              isLoading: false,
            };
          });
          return conversation;
        } catch (error) {
          console.error(
            "[ConversationStore] Error getting conversation:",
            error
          );
          set({
            isLoading: false,
            error: error instanceof Error ? error : new Error(String(error)),
          });
          throw error;
        }
      },

      getConversations: async () => {
        // await loadConversations(); // Wrapped in `persist`, we might have data already?
        // But for safety/sync, let's call init logic if needed.
        // We'll stick to calling initializeIfAuthenticated explicitly in app flow.
        // But for this method, if initialized is true, maybe just return?
        // Implementation kept same as before but referring to internal logic
        // We will just return values here, init logic is separate.
        return Array.from(get().conversations.values());
      },

      deleteConversation: async (id) => {
        const { conversations, conversationConfigs, activeConversationId } =
          get();
        const conversationToDelete = conversations.get(id);
        const configToDelete = conversationConfigs.get(id);

        set((state) => {
          const newConversations = new Map(state.conversations);
          newConversations.delete(id);

          const newConfigs = new Map(state.conversationConfigs);
          newConfigs.delete(id);

          const newActiveId =
            state.activeConversationId === id
              ? null
              : state.activeConversationId;

          return {
            conversations: newConversations,
            conversationConfigs: newConfigs,
            activeConversationId: newActiveId,
            error: null,
          };
        });

        try {
          await conversationService.deleteConversation(id);
        } catch (error) {
          console.error(
            "[ConversationStore] Error deleting conversation:",
            error
          );
          if (conversationToDelete) {
            set((state) => {
              const newConversations = new Map(state.conversations);
              newConversations.set(id, conversationToDelete);

              const newConfigs = new Map(state.conversationConfigs);
              if (configToDelete) {
                newConfigs.set(id, configToDelete);
              }

              return {
                conversations: newConversations,
                conversationConfigs: newConfigs,
                activeConversationId: activeConversationId,
                isLoading: false,
                error:
                  error instanceof Error ? error : new Error(String(error)),
              };
            });
          }
          throw error;
        }
      },

      setActiveConversation: (id) => {
        set({ activeConversationId: id });
      },

      checkTimeout: () => {
        const { activeConversationId, conversations } = get();
        if (!activeConversationId) return;

        const conversation = conversations.get(activeConversationId);
        if (!conversation) return;

        const lastMessageAt = new Date(conversation.updated_at).getTime();
        const now = Date.now();
        const diffMins = (now - lastMessageAt) / 1000 / 60;

        if (diffMins >= 120) {
          console.log(
            "⏳ Conversation timed out, archiving:",
            activeConversationId
          );
          set((state) => {
            const newConversations = new Map(state.conversations);
            const updatedConv = {
              ...conversation,
              status: "archived" as const,
            };
            newConversations.set(activeConversationId, updatedConv);

            return {
              conversations: newConversations,
              activeConversationId: null,
            };
          });
        }
      },

      resumeConversation: (id) => {
        set((state) => {
          const conversation = state.conversations.get(id);
          if (!conversation) return {};

          const newConversations = new Map(state.conversations);
          const updatedConv = {
            ...conversation,
            status: "active" as const,
            updated_at: new Date(), // Bump timestamp on resume
          };
          newConversations.set(id, updatedConv);

          return {
            conversations: newConversations,
            activeConversationId: id,
          };
        });
      },

      touchConversation: (id) => {
        set((state) => {
          const conversation = state.conversations.get(id);
          if (!conversation) return {};

          const newConversations = new Map(state.conversations);
          const updatedConv = {
            ...conversation,
            updated_at: new Date(),
            status: "active" as const, // Ensure active if touched
          };
          newConversations.set(id, updatedConv);

          return { conversations: newConversations };
        });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "conversation-store",
      storage: {
        getItem: async (name) => {
          const str = await AsyncStorage.getItem(name);
          if (!str) return null;
          const { state } = JSON.parse(str);
          return {
            state: {
              ...state,
              conversations: new Map(state.conversations),
              conversationConfigs: new Map(state.conversationConfigs),
            },
          };
        },
        setItem: (name, value) => {
          const state = {
            ...value.state,
            conversations: Array.from(value.state.conversations.entries()),
            conversationConfigs: Array.from(
              value.state.conversationConfigs.entries()
            ),
          };
          return AsyncStorage.setItem(name, JSON.stringify({ state }));
        },
        removeItem: AsyncStorage.removeItem,
      },
      partialize: (state) => ({
        conversations: state.conversations,
        conversationConfigs: state.conversationConfigs,
        activeConversationId: state.activeConversationId,
        suggestedActions: state.suggestedActions,
        // pendingChatOpen is transient
        // pendingChatOpen is transient
      }),
    }
  )
);
