import { useMemo } from 'react';
import { Message } from '@/types';

import { useConversationStore } from '@/stores/chat/ConversationStore';

export function useQuickChatActions(recentMessages?: Message[]) {
  const suggestedActions = useConversationStore(state => state.suggestedActions);

  const actions = useMemo(() => {
    // Priority 1: Dynamic LLM Actions (if available)
    if (suggestedActions && suggestedActions.length > 0) {
      return suggestedActions;
    }

    // State A: Fresh (No recent messages or empty conversation)
    if (!recentMessages || recentMessages.length === 0) {
      return [
        { label: 'Track workout', message: 'I want to track my workout' },
        { label: 'Show progress', message: 'Can you show me my recent progress?' },
        { label: 'Plan workout', message: 'Help me plan my next workout' }
      ];
    }

    // State B: Active (Has recent messages)
    // Use LLM generated actions from store
    // Fallback to defaults if store is empty but we have messages (shouldn't happen often if fetch works)
    return suggestedActions && suggestedActions.length > 0 
      ? suggestedActions 
      : [
          { label: 'Continue workout', message: "Let's continue with my workout" },
          { label: 'End session', message: "I'd like to end this workout session" },
          { label: 'Ask question', message: 'I have a question about my training' }
        ];
  }, [recentMessages, suggestedActions]);

  return actions;
}
