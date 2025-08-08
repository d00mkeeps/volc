import { create } from "zustand";
import { conversationService } from "../../services/db/conversation";
import { Conversation, ChatConfigName } from "@/types";
import { authService } from "@/services/db/auth";
import { useMessageStore } from "./MessageStore";
import { useUserStore } from "../userProfileStore";

interface ConversationStoreState {
  // State
  conversations: Map<string, Conversation>;
  activeConversationId: string | null;
  conversationConfigs: Map<string, ChatConfigName>;
  isLoading: boolean;
  error: Error | null;
  initialized: boolean;

  // Auth-triggered methods (called by authStore)
  initializeIfAuthenticated: () => Promise<void>;
  clearData: () => void;

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

  // Config resolution
  getConversationConfig: (id: string) => Promise<ChatConfigName>;

  // Utility methods
  clearError: () => void;
}

export const useConversationStore = create<ConversationStoreState>(
  (set, get) => {
    const loadConversations = async () => {
      try {
        console.log("Getting user conversations");
        set({ isLoading: true, error: null });

        const session = await authService.getSession();
        if (!session?.user?.id) {
          throw new Error("No authenticated user found");
        }

        const conversations = await conversationService.getUserConversations();

        const newConversations = new Map();
        const newConfigs = new Map();

        conversations.forEach((conversation) => {
          newConversations.set(conversation.id, conversation);
          if (conversation.config_name) {
            newConfigs.set(
              conversation.id,
              conversation.config_name as ChatConfigName
            );
          }
        });

        set({
          conversations: newConversations,
          conversationConfigs: newConfigs,
          initialized: true,
        });

        console.log(`Loaded ${conversations.length} conversations`);
      } catch (err) {
        console.error("Error loading conversations:", err);
        set({
          error:
            err instanceof Error
              ? err
              : new Error("Failed to load conversations"),
          initialized: true,
        });
      } finally {
        set({ isLoading: false });
      }
    };

    return {
      // Initial state - clean slate
      conversations: new Map(),
      activeConversationId: null,
      conversationConfigs: new Map(),
      isLoading: false,
      error: null,
      initialized: false,

      async initializeIfAuthenticated() {
        console.log("🗣️ ConversationStore: Starting initialization...");

        const userProfile = useUserStore.getState().userProfile;
        if (!userProfile?.auth_user_uuid) {
          console.log("🗣️ ConversationStore: No user profile, skipping");
          return;
        }

        try {
          console.log(
            "🗣️ ConversationStore: Loading conversations with messages..."
          );
          set({ isLoading: true, error: null });

          const result =
            await conversationService.getConversationsWithRecentMessages(
              userProfile.auth_user_uuid
            );

          console.log(
            "🗣️ ConversationStore: Got",
            result.conversations.length,
            "conversations"
          );
          console.log(
            "🗣️ ConversationStore: Got messages for",
            Object.keys(result.messages).length,
            "conversations"
          );

          const conversationsMap = new Map(
            result.conversations.map((conv) => [conv.id, conv])
          );

          useMessageStore.getState().setBulkMessages(result.messages);

          set({
            conversations: conversationsMap,
            isLoading: false,
          });

          console.log("✅ ConversationStore: Initialization complete");
        } catch (error) {
          console.error("❌ ConversationStore: Initialization failed:", error);
          set({
            isLoading: false,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      },
      // Called by authStore when user logs out
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

      // Create a new conversation
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

      // Get a specific conversation
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

      // Get all conversations (public method)
      getConversations: async () => {
        await loadConversations();
        return Array.from(get().conversations.values());
      },

      // Get conversation config
      getConversationConfig: async (id) => {
        const existingConfig = get().conversationConfigs.get(id);
        if (existingConfig) {
          return existingConfig;
        }

        try {
          const conversation = await get().getConversation(id);
          const configName =
            (conversation.config_name as ChatConfigName) || "default";

          set((state) => {
            const newConfigs = new Map(state.conversationConfigs);
            newConfigs.set(id, configName);
            return { conversationConfigs: newConfigs };
          });

          return configName;
        } catch (error) {
          console.error(
            "[ConversationStore] Error resolving conversation config:",
            error
          );
          return "default";
        }
      },

      deleteConversation: async (id) => {
        // Optimistic update - remove immediately
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

          // Rollback on failure - restore the conversation
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

      // Set active conversation
      setActiveConversation: (id) => {
        set({ activeConversationId: id });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },
    };
  }
);
