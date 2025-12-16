import { create } from "zustand";
import { getWebSocketService } from "@/services/websocket/WebSocketService";
import { useMessageStore } from "@/stores/chat/MessageStore";
import { useConversationStore } from "@/stores/chat/ConversationStore";
import { useUserStore } from "@/stores/userProfileStore";
import { quickChatService } from "@/services/api/quickChatService";
import type { ConnectionState } from "@/services/websocket/WebSocketService";
import { Message } from "@/types";
import Toast from "react-native-toast-message";

type LoadingState = "idle" | "pending" | "streaming" | "complete";

interface ChatStore {
  // Connection state
  connectionState: ConnectionState;
  loadingState: LoadingState;
  statusMessage: string | null;
  lastCancelTime: number; // For cooldown tracking

  // Quick chat
  greeting: string | null;
  actions: Array<{ label: string; message: string }> | null;
  isLoadingGreeting: boolean;
  isLoadingActions: boolean;

  // Streaming preview
  streamingContent: string;

  // Websocket handler refs
  _handlerRefs: (() => void)[];

  // Methods
  connect: () => Promise<void>;
  disconnect: () => void;
  sendMessage: (content: string) => Promise<void>;
  cancelStreaming: (reason: "user_requested" | "network_failure") => void;
  computeGreeting: () => void;
  fetchActions: () => Promise<void>;
  refreshQuickChat: () => void;
  setLoadingState: (state: LoadingState) => void;
  _registerHandlers: (conversationId: string) => void;
  _updateConnectionState: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  connectionState: "disconnected",
  loadingState: "idle",
  statusMessage: null,
  lastCancelTime: 0,
  greeting: null,
  actions: null,
  isLoadingGreeting: true,
  isLoadingActions: true,
  streamingContent: "",
  _handlerRefs: [],

  setLoadingState: (loadingState) => {
    set({ loadingState });

    // Side effects on state changes
    if (loadingState === "complete") {
      // Refresh greeting and actions when message completes
      get().refreshQuickChat();
      // Reset to idle after side effects
      setTimeout(
        () => set({ loadingState: "idle", streamingContent: "" }),
        100
      );
    }
  },

  _updateConnectionState: () => {
    const webSocketService = getWebSocketService();
    const newState = webSocketService.getConnectionState();
    set({ connectionState: newState });
  },

  computeGreeting: () => {
    set({ isLoadingGreeting: true });

    const userProfile = useUserStore.getState().userProfile;
    const contextBundle = useUserStore.getState().contextBundle;
    const activeConversationId =
      useConversationStore.getState().activeConversationId;

    if (!userProfile || !contextBundle) {
      set({ greeting: null, isLoadingGreeting: false });
      return;
    }

    const firstName = userProfile.first_name || "";
    const memory = contextBundle.ai_memory;
    const isNewUser = !memory || !memory.notes || memory.notes.length === 0;

    // If active conversation, get last AI message
    if (activeConversationId) {
      const messages = useMessageStore
        .getState()
        .messages.get(activeConversationId);
      if (messages && messages.length > 0) {
        const lastAiMsg = [...messages]
          .reverse()
          .find((m) => m.sender === "assistant");
        if (lastAiMsg) {
          set({ greeting: lastAiMsg.content, isLoadingGreeting: false });
          return;
        }
      }
    }

    // Generate greeting based on time and user status
    const stableRandom = (max: number) => {
      const userId = userProfile.user_id?.toString() || "0";
      let hash = 0;
      for (let i = 0; i < userId.length; i++) {
        hash = (hash << 5) - hash + userId.charCodeAt(i);
        hash = hash & hash;
      }
      return Math.abs(hash) % max;
    };

    let greeting: string;
    if (!isNewUser) {
      const hour = new Date().getHours();
      let options: string[];

      if (hour >= 5 && hour < 12) {
        options = [
          `Good morning, ${firstName}. Ready to plan a workout or review your progress?`,
          `Morning, ${firstName}! Want to plan today's session or check how your training's going?`,
          `Hey ${firstName}, morning! I can help plan a workout, analyze your progress, or talk recovery.`,
        ];
      } else if (hour >= 12 && hour < 17) {
        options = [
          `Good afternoon, ${firstName}. Need help planning a session or reviewing your training?`,
          `Hey ${firstName}! Want to plan a workout, check your progress, or optimize recovery?`,
          `Afternoon, ${firstName}. Let's plan your next workout or see how you're progressing.`,
        ];
      } else {
        options = [
          `Evening, ${firstName}. Time to plan tomorrow's workout or review today's training?`,
          `Hey ${firstName}, good evening! Want to prep for tomorrow or check your recent progress?`,
          `Evening, ${firstName}. I can help plan your next session or analyze your training.`,
        ];
      }
      greeting = options[stableRandom(options.length)];
    } else {
      greeting = firstName
        ? `Welcome to Volc, ${firstName}! I'm excited to work with you. To start, what's one of your main fitness goals?`
        : "Welcome to Volc! I'm excited to work with you. To start, what's one of your main fitness goals?";
    }

    set({ greeting, isLoadingGreeting: false });
  },

  fetchActions: async () => {
    const userProfile = useUserStore.getState().userProfile;
    const contextBundle = useUserStore.getState().contextBundle;
    const activeConversationId =
      useConversationStore.getState().activeConversationId;

    if (!contextBundle) {
      set({ actions: null, isLoadingActions: false });
      return;
    }

    const memory = contextBundle.ai_memory;
    const isNewUser = !memory || !memory.notes || memory.notes.length === 0;

    // New user onboarding actions
    if (isNewUser) {
      set({
        actions: [
          { label: "Set goals", message: "I'd like to set some fitness goals" },
          { label: "Learn about Volc", message: "What can you help me with?" },
          { label: "Track workout", message: "I want to track my workout" },
        ],
        isLoadingActions: false,
      });
      return;
    }

    // Active conversation - fetch contextual actions
    if (activeConversationId) {
      const messages = useMessageStore
        .getState()
        .messages.get(activeConversationId);
      if (messages && messages.length > 0) {
        set({ isLoadingActions: true });

        try {
          if (!userProfile?.auth_user_uuid) {
            throw new Error("No auth user UUID");
          }

          const recentMessages = messages.slice(-10).map((m) => ({
            sender: m.sender,
            content: m.content,
          }));

          const fetchedActions = await quickChatService.fetchQuickActions(
            userProfile.auth_user_uuid,
            recentMessages
          );

          set({
            actions:
              fetchedActions.length > 0
                ? fetchedActions
                : [
                    {
                      label: "Track workout",
                      message: "I want to track my workout",
                    },
                    {
                      label: "Show progress",
                      message: "Can you show me my recent progress?",
                    },
                    {
                      label: "Plan workout",
                      message: "Help me plan my next workout",
                    },
                  ],
            isLoadingActions: false,
          });
        } catch (error) {
          console.error("[ChatStore] Failed to fetch actions:", error);
          set({
            actions: [
              { label: "Track workout", message: "I want to track my workout" },
              {
                label: "Show progress",
                message: "Can you show me my recent progress?",
              },
              {
                label: "Plan workout",
                message: "Help me plan my next workout",
              },
            ],
            isLoadingActions: false,
          });
        }
        return;
      }
    }

    // Default actions
    set({
      actions: [
        { label: "Track workout", message: "I want to track my workout" },
        {
          label: "Show progress",
          message: "Can you show me my recent progress?",
        },
        { label: "Plan workout", message: "Help me plan my next workout" },
      ],
      isLoadingActions: false,
    });
  },

  refreshQuickChat: () => {
    get().computeGreeting();
    get().fetchActions();
  },

  _registerHandlers: (conversationId: string) => {
    const webSocketService = getWebSocketService();

    // Clear old handlers
    const { _handlerRefs } = get();
    _handlerRefs.forEach((unsubscribe) => unsubscribe());

    // Check for active streams before nuclear cleanup
    const activeStreams = Array.from(
      useMessageStore.getState().streamingMessages.entries()
    ).filter(([_, msg]) => msg && !msg.isComplete);

    if (activeStreams.length === 0) {
      webSocketService.removeAllListeners();
    }

    // Register new handlers
    const unsubscribeStatus = webSocketService.onStatus((statusText) => {
      set({ statusMessage: statusText });
    });

    const unsubscribeContent = webSocketService.onMessage((chunk) => {
      useMessageStore.getState().updateStreamingMessage(conversationId, chunk);
      // Update loading state to streaming on first chunk
      if (get().loadingState === "pending") {
        set({ loadingState: "streaming" });
      }
    });

    const unsubscribeComplete = webSocketService.onComplete(() => {
      useMessageStore.getState().completeStreamingMessage(conversationId);
      set({ statusMessage: null });
      get().setLoadingState("complete");
    });

    const unsubscribeTerminated = webSocketService.onTerminated((reason) => {
      useMessageStore.getState().clearStreamingMessage(conversationId);
      set({ statusMessage: null, loadingState: "idle", streamingContent: "" });
      Toast.show({
        type: "info",
        text1: "Message Cut Off",
        text2: "Response was interrupted",
      });
    });

    const unsubscribeError = webSocketService.onError((error) => {
      useMessageStore.getState().clearStreamingMessage(conversationId);
      useMessageStore.getState().setError(error);
      set({ statusMessage: null, loadingState: "idle", streamingContent: "" });
      Toast.show({
        type: "error",
        text1: "Connection Error",
        text2: error.message || "WebSocket connection failed",
      });
    });

    set({
      _handlerRefs: [
        unsubscribeStatus,
        unsubscribeContent,
        unsubscribeComplete,
        unsubscribeTerminated,
        unsubscribeError,
      ],
    });
  },

  connect: async () => {
    const webSocketService = getWebSocketService();

    try {
      let activeConversationId =
        useConversationStore.getState().activeConversationId;

      // Create conversation if none exists
      if (!activeConversationId) {
        const {
          pendingGreeting,
          pendingInitialMessage,
          setPendingInitialMessage,
          setPendingGreeting,
          createConversationWithMessages,
        } = useConversationStore.getState();

        const messagesToCreate: {
          content: string;
          sender: "user" | "assistant";
        }[] = [];

        if (pendingGreeting) {
          messagesToCreate.push({
            content: pendingGreeting,
            sender: "assistant",
          });
        }

        if (pendingInitialMessage) {
          messagesToCreate.push({
            content: pendingInitialMessage,
            sender: "user",
          });
          setPendingInitialMessage(null);
        } else if (messagesToCreate.length === 0) {
          messagesToCreate.push({
            content: "Hello! Ready to workout?",
            sender: "assistant",
          });
        }

        if (messagesToCreate.length > 0) {
          const result = await createConversationWithMessages(messagesToCreate);
          activeConversationId = result.conversationId;
          setPendingGreeting(null);
        }
      }

      if (!activeConversationId) {
        throw new Error("Failed to establish conversation ID");
      }

      // Register handlers
      get()._registerHandlers(activeConversationId);

      // Connect websocket
      await webSocketService.ensureConnection({
        type: "coach",
        conversationId: activeConversationId,
      });

      // Update connection state
      get()._updateConnectionState();

      // Handle pending message for existing conversation
      const { pendingInitialMessage, setPendingInitialMessage } =
        useConversationStore.getState();
      if (pendingInitialMessage) {
        setPendingInitialMessage(null);
        await get().sendMessage(pendingInitialMessage);
      }
    } catch (error) {
      console.error("[ChatStore] Failed to connect:", error);
      const { _handlerRefs } = get();
      _handlerRefs.forEach((unsubscribe) => unsubscribe());
      set({ _handlerRefs: [] });
      useMessageStore
        .getState()
        .setError(error instanceof Error ? error : new Error(String(error)));
    }
  },

  disconnect: () => {
    const webSocketService = getWebSocketService();
    const { _handlerRefs, loadingState } = get();

    // Don't disconnect if actively loading or streaming
    if (loadingState === "pending" || loadingState === "streaming") {
      console.log(
        "[ChatStore] Skipping disconnect - active operation in progress"
      );
      return;
    }

    _handlerRefs.forEach((unsubscribe) => unsubscribe());
    set({ _handlerRefs: [], statusMessage: null });

    webSocketService.setDisconnectReason("user_initiated");
    webSocketService.disconnect();

    get()._updateConnectionState();
  },

  cancelStreaming: (reason) => {
    const { loadingState, lastCancelTime } = get();
    const webSocketService = getWebSocketService();

    // Check if streaming
    if (loadingState !== "streaming" && loadingState !== "pending") {
      console.log("[ChatStore] Not streaming/pending, ignoring cancel");
      return;
    }

    // 5s cooldown protection (only for user requests)
    const now = Date.now();
    if (reason === "user_requested" && now - lastCancelTime < 5000) {
      Toast.show({
        type: "info",
        text1: "Please wait",
        text2: "Too many cancellations, cooling down",
      });
      return;
    }

    console.log(`[ChatStore] Cancelling stream: ${reason}`);

    // Send cancel message to backend
    try {
      webSocketService.sendMessage({
        type: "cancel",
        reason,
      });
    } catch (error) {
      console.error("[ChatStore] Failed to send cancel message:", error);
    }

    // Update local state immediately
    const activeConversationId =
      useConversationStore.getState().activeConversationId;
    if (activeConversationId) {
      useMessageStore.getState().clearStreamingMessage(activeConversationId);
    }

    set({
      loadingState: "idle",
      streamingContent: "",
      lastCancelTime: now,
    });

    // Show appropriate toast
    if (reason === "user_requested") {
      Toast.show({
        type: "info",
        text1: "Message Cancelled",
        text2: "Stream stopped by user",
      });
    } else {
      Toast.show({
        type: "error",
        text1: "Message Cancelled",
        text2: "Poor network connection detected",
      });
    }
  },

  sendMessage: async (content: string) => {
    const webSocketService = getWebSocketService();

    try {
      let conversationId = useConversationStore.getState().activeConversationId;

      if (!conversationId) {
        const { createConversationWithMessages } =
          useConversationStore.getState();
        const result = await createConversationWithMessages([
          { content, sender: "user" },
        ]);
        conversationId = result.conversationId;

        get()._registerHandlers(conversationId);
        await webSocketService.ensureConnection({
          type: "coach",
          conversationId: conversationId,
        });
      }

      // Set loading state
      set({ loadingState: "pending", streamingContent: "" });

      // Optimistic update
      const userMessage: Message = {
        id: `temp-user-${Date.now()}`,
        conversation_id: conversationId,
        content,
        sender: "user",
        conversation_sequence: Date.now(),
        timestamp: new Date(),
      };
      useMessageStore.getState().addMessage(conversationId, userMessage);

      // Touch conversation
      useConversationStore.getState().touchConversation(conversationId);

      // Send message
      const currentMessages =
        useMessageStore.getState().messages.get(conversationId) || [];
      const payload = {
        type: "message",
        message: content,
        conversation_history: currentMessages,
      };

      if (!webSocketService.isConnected()) {
        await webSocketService.ensureConnection({
          type: "coach",
          conversationId: conversationId,
        });
      }

      webSocketService.sendMessage(payload);
    } catch (error) {
      console.error("[ChatStore] Error sending message:", error);
      const errorMessage =
        error instanceof Error ? error : new Error(String(error));

      Toast.show({
        type: "error",
        text1: "Send Failed",
        text2: errorMessage.message,
      });

      useMessageStore.getState().setError(errorMessage);
      set({ loadingState: "idle" });
      throw errorMessage;
    }
  },
}));

// Poll connection state
setInterval(() => {
  useChatStore.getState()._updateConnectionState();
}, 500);
