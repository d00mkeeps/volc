// /stores/onboarding/OnboardingStore.ts
import { create } from "zustand";
import type { Message } from "@/types";

interface StreamingMessage {
  content: string;
  isComplete: boolean;
}

interface OnboardingStoreState {
  // Messages
  messages: Message[];
  streamingMessage: StreamingMessage | null;

  // Loading & error states
  isLoading: boolean;
  error: Error | null;

  // Onboarding completion data
  profileData: {
    first_name?: string;
    last_name?: string;
    age?: number;
    is_imperial?: boolean;
    goals?: { content: string };
    current_stats?: string;
    preferences?: any;
  } | null;
  isOnboardingComplete: boolean;

  // Actions
  addMessage: (message: Message) => void;
  updateStreamingMessage: (content: string) => void;
  completeStreamingMessage: () => void;
  clearStreamingMessage: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  setProfileData: (data: any) => void;
  setOnboardingComplete: (complete: boolean) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingStoreState>((set, get) => ({
  // Initial state
  messages: [],
  streamingMessage: null,
  isLoading: false,
  error: null,
  profileData: null,
  isOnboardingComplete: false,

  // /stores/onboarding/OnboardingStore.addMessage
  addMessage: (message: Message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  // /stores/onboarding/OnboardingStore.updateStreamingMessage
  updateStreamingMessage: (content: string) => {
    set((state) => ({
      streamingMessage: {
        content: state.streamingMessage
          ? state.streamingMessage.content + content
          : content,
        isComplete: false,
      },
    }));
  },

  // /stores/onboarding/OnboardingStore.completeStreamingMessage
  completeStreamingMessage: () => {
    const state = get();

    if (state.streamingMessage && state.streamingMessage.content.trim()) {
      // Convert streaming message to permanent message
      const assistantMessage: Message = {
        id: `onboarding-ai-${Date.now()}`,
        conversation_id: "onboarding",
        content: state.streamingMessage.content,
        sender: "assistant",
        conversation_sequence: state.messages.length + 1,
        timestamp: new Date(),
      };

      set({
        messages: [...state.messages, assistantMessage],
        streamingMessage: null,
      });
    } else {
      set({ streamingMessage: null });
    }
  },

  // /stores/onboarding/OnboardingStore.clearStreamingMessage
  clearStreamingMessage: () => {
    set({ streamingMessage: null });
  },

  // /stores/onboarding/OnboardingStore.setLoading
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  // /stores/onboarding/OnboardingStore.setError
  setError: (error: Error | null) => {
    set({ error });
  },

  // /stores/onboarding/OnboardingStore.setProfileData
  setProfileData: (data: any) => {
    set({
      profileData: data,
      isOnboardingComplete: true,
    });
  },

  // /stores/onboarding/OnboardingStore.setOnboardingComplete
  setOnboardingComplete: (complete: boolean) => {
    set({ isOnboardingComplete: complete });
  },

  // /stores/onboarding/OnboardingStore.reset
  reset: () => {
    set({
      messages: [],
      streamingMessage: null,
      isLoading: false,
      error: null,
      profileData: null,
      isOnboardingComplete: false,
    });
  },
}));
