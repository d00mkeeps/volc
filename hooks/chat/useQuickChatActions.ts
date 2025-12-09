import { useMemo } from 'react';
import { Message } from '@/types';

const FRESH_REPLIES = [
  "Ready to workout",
  "Help me plan",
  "Just chatting"
];

const ACTIVE_REPLIES = [
  "Add set",
  "Finish workout",
  "Modify weight"
];

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
      return FRESH_REPLIES;
    }

    // State B: Active (Has recent messages)
    // Future: Use LLM to generate these based on conversation context
    return ACTIVE_REPLIES;
  }, [recentMessages, suggestedActions]);

  return actions;
}
