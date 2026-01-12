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
  lastCancelTime: number;

  // Quick chat
  greeting: string | null;
  actions: Array<{ label: string; message: string }> | null;
  isLoadingGreeting: boolean;
  isLoadingActions: boolean;

  // Streaming preview
  streamingContent: string;

  // Failed message recovery
  failedMessageContent: string | null;

  _handlerRefs: (() => void)[];
  _initializationPromise: Promise<void> | null;

  // Methods
  connect: () => Promise<void>;
  disconnect: () => void;
  sendMessage: (
    content: string,
    getCurrentHealth?: () => "good" | "poor" | "offline"
  ) => Promise<void>;
  cancelStreaming: (reason: "user_requested" | "network_failure") => void;
  computeGreeting: () => void;
  fetchActions: () => Promise<void>;
  refreshQuickChat: () => void;
  setLoadingState: (state: LoadingState) => void;
  setFailedMessageContent: (content: string | null) => void;
  _registerHandlers: (conversationId: string) => void;
  _updateConnectionState: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  failedMessageContent: null,
  _initializationPromise: null,

  setFailedMessageContent: (content) => set({ failedMessageContent: content }),

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

    // DEBUG: Trace ai_memory state
    console.log("🔍 [fetchActions] START");
    console.log("🔍 [fetchActions] contextBundle exists:", !!contextBundle);
    console.log(
      "🔍 [fetchActions] contextBundle.ai_memory:",
      contextBundle?.ai_memory
    );
    console.log(
      "🔍 [fetchActions] ai_memory.notes:",
      contextBundle?.ai_memory?.notes
    );
    console.log(
      "🔍 [fetchActions] notes length:",
      contextBundle?.ai_memory?.notes?.length
    );

    if (!contextBundle) {
      console.log(
        "🔍 [fetchActions] No contextBundle - returning null actions"
      );
      set({ actions: null, isLoadingActions: false });
      return;
    }

    const memory = contextBundle.ai_memory;
    const hasAiMemory = memory && memory.notes && memory.notes.length > 0;
    console.log("🔍 [fetchActions] hasAiMemory:", hasAiMemory);

    // For NEW users (no AI memory), check if they've sent a message yet
    if (!hasAiMemory) {
      let hasUserMessages = false;
      if (activeConversationId) {
        const messages = useMessageStore
          .getState()
          .messages.get(activeConversationId);
        if (messages && messages.length > 0) {
          hasUserMessages = messages.some((m) => m.sender === "user");
        }
      }

      // Show default actions only if new user hasn't sent a message yet
      if (!hasUserMessages) {
        console.log(
          "🔍 [fetchActions] SHOWING DEFAULT NEW USER ACTIONS - hasAiMemory:",
          hasAiMemory,
          "hasUserMessages:",
          hasUserMessages
        );
        set({
          actions: [
            {
              label: "Set goals",
              message: "I'd like to set some fitness goals",
            },
            {
              label: "Learn about Volc",
              message: "What can you help me with?",
            },
            { label: "Track workout", message: "I want to track my workout" },
          ],
          isLoadingActions: false,
        });
        return;
      }
    }

    // For existing users OR new users after first message - fetch contextual actions
    set({ isLoadingActions: true });

    try {
      if (!userProfile?.auth_user_uuid) {
        throw new Error("No auth user UUID");
      }

      let recentMessages:
        | Array<{ sender: "user" | "assistant"; content: string }>
        | undefined;

      if (activeConversationId) {
        const messages = useMessageStore
          .getState()
          .messages.get(activeConversationId);
        if (messages && messages.length > 0) {
          recentMessages = messages.slice(-10).map((m) => ({
            sender: m.sender,
            content: m.content,
          }));
        }
      }

      const fetchedActions = await quickChatService.fetchQuickActions(
        userProfile.auth_user_uuid,
        recentMessages
      );

      set({
        actions:
          fetchedActions.actions.length > 0
            ? fetchedActions.actions
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
      const { loadingState } = get();
      if (loadingState !== "streaming" && loadingState !== "pending") {
        return; // ← Ignore chunks when not actively streaming
      }

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

    const unsubscribeCancelled = webSocketService.onCancelled((data) => {
      console.log(`[ChatStore] Backend confirmed cancel: ${data.reason}`);
      // Complete whatever we have (don't clear)
      useMessageStore.getState().completeStreamingMessage(conversationId);
      set({ statusMessage: null });
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
        unsubscribeCancelled,
        unsubscribeTerminated,
        unsubscribeError,
      ],
    });
  },

  connect: async () => {
    console.log("🔌 [ChatStore.connect] START");
    const webSocketService = getWebSocketService();

    try {
      const { _initializationPromise } = get();
      if (_initializationPromise) {
        await _initializationPromise;
      }

      let activeConversationId =
        useConversationStore.getState().activeConversationId;
      console.log(
        "🔌 [ChatStore.connect] activeConversationId:",
        activeConversationId
      );
      // Create conversation if none exists
      if (!activeConversationId) {
        console.log(
          "🔌 [ChatStore.connect] activeConversationId:",
          activeConversationId
        );
        // Create a new promise for this initialization
        let resolveInit: (() => void) | undefined;
        const initPromise = new Promise<void>((resolve) => {
          resolveInit = resolve;
        });
        set({ _initializationPromise: initPromise });

        try {
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

          const greetingToUse = pendingGreeting || get().greeting;

          if (greetingToUse) {
            messagesToCreate.push({
              content: greetingToUse,
              sender: "assistant",
            });
          }

          if (pendingInitialMessage) {
            messagesToCreate.push({
              content: pendingInitialMessage,
              sender: "user",
            });
            setPendingInitialMessage(null);
          }

          // Only use hardcoded fallback if we have nothing else
          if (messagesToCreate.length === 0) {
            messagesToCreate.push({
              content: "Hello! Ready to workout?",
              sender: "assistant",
            });
          }

          if (messagesToCreate.length > 0) {
            const result = await createConversationWithMessages(
              messagesToCreate
            );
            activeConversationId = result.conversationId;
            setPendingGreeting(null);
          }
        } finally {
          // Always clear the promise, even if creation failed
          set({ _initializationPromise: null });
          resolveInit?.();
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

    if (loadingState !== "streaming" && loadingState !== "pending") {
      console.log("[ChatStore] Not streaming/pending, ignoring cancel");
      return;
    }

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

    try {
      getWebSocketService().sendMessage({ type: "cancel", reason });
    } catch (error) {
      console.error("[ChatStore] Failed to send cancel:", error);
    }

    set({
      loadingState: "idle", // Guard in onMessage will ignore new chunks
      streamingContent: "",
      lastCancelTime: now,
    });

    Toast.show({
      type: "info",
      text1: "Stopping...",
      text2: "Cancelling message generation",
    });
  },

  sendMessage: async (
    content: string,
    getCurrentHealth?: () => "good" | "poor" | "offline"
  ) => {
    console.log(
      "📤 [ChatStore.sendMessage] START - content:",
      content.substring(0, 50)
    );
    console.log(
      "📤 [ChatStore.sendMessage] activeConversationId:",
      useConversationStore.getState().activeConversationId
    );

    const webSocketService = getWebSocketService();
    const currentHealth = getCurrentHealth?.() || "good"; // ← Use optional chaining with fallback
    let messageSentToBackend = false;
    try {
      // WAIT FOR INITIALIZATION IF IN PROGRESS
      const { _initializationPromise } = get();
      if (_initializationPromise) {
        console.log(
          "[ChatStore] Initialization in progress, waiting before sending..."
        );
        await _initializationPromise;
      }

      // Get or create conversation
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

      // Show warning for poor or offline network
      if (currentHealth === "poor" || currentHealth === "offline") {
        Toast.show({
          type: "info",
          text1: "Poor Connection",
          text2: "Messages may take longer than usual",
          visibilityTime: 3000,
        });
      }

      // Add optimistic message immediately
      const tempMessageId = `temp-user-${Date.now()}`;
      const userMessage: Message = {
        id: tempMessageId,
        conversation_id: conversationId,
        content,
        sender: "user",
        conversation_sequence: Date.now(),
        timestamp: new Date(),
      };
      useMessageStore.getState().addMessage(conversationId, userMessage);

      // Set loading state
      set({ loadingState: "pending", streamingContent: "" });

      // If offline, wait up to 5s for network to improve
      if (currentHealth === "offline") {
        console.log(
          "[ChatStore] Offline detected - waiting for network improvement"
        );

        const startTime = Date.now();
        const maxWait = 5000;
        const pollInterval = 500;

        while (Date.now() - startTime < maxWait) {
          await new Promise((resolve) => setTimeout(resolve, pollInterval));

          const healthNow = getCurrentHealth?.() || "good";
          if (healthNow !== "offline") {
            console.log(
              `[ChatStore] Network improved to ${healthNow} after ${
                Date.now() - startTime
              }ms`
            );
            break;
          }
        }

        // Check final network status
        const finalHealth = getCurrentHealth?.() || "good";
        if (finalHealth === "offline") {
          console.log(
            "[ChatStore] Still offline after 5s - rolling back message"
          );

          // Remove optimistic message
          useMessageStore
            .getState()
            .removeMessage(conversationId, tempMessageId);

          // Store content for recovery
          set({
            failedMessageContent: content,
            loadingState: "idle",
            streamingContent: "",
          });

          Toast.show({
            type: "error",
            text1: "Connection Failed",
            text2: "No internet connection",
            visibilityTime: 4000,
          });

          return; // Exit without sending
        }
      }

      // Network is good or poor - proceed with send
      console.log("[ChatStore] Sending message to backend");

      // Touch conversation
      useConversationStore.getState().touchConversation(conversationId);

      // Build payload
      const currentMessages =
        useMessageStore.getState().messages.get(conversationId) || [];
      const payload = {
        type: "message",
        message: content,
        conversation_history: currentMessages,
      };

      // Ensure connection and send
      if (!webSocketService.isConnected()) {
        await webSocketService.ensureConnection({
          type: "coach",
          conversationId: conversationId,
        });
      }

      webSocketService.sendMessage(payload);
      messageSentToBackend = true;

      console.log("[ChatStore] Message sent to backend successfully");
    } catch (error) {
      console.error("[ChatStore] Error sending message:", error);
      const errorMessage =
        error instanceof Error ? error : new Error(String(error));

      // Only rollback if we never sent to backend
      if (!messageSentToBackend) {
        const conversationId =
          useConversationStore.getState().activeConversationId;
        if (conversationId) {
          const tempMessageId = `temp-user-${Date.now()}`; // Would need to track this better
          useMessageStore
            .getState()
            .removeMessage(conversationId, tempMessageId);
          set({ failedMessageContent: content });
        }
      }

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
