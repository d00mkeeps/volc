# Welcome

Current objectives:

### Conversation creation!

This is exciting! I'm already assigning a uuid to each newly created conversation, the next steps would look at follows:

**Note: fix the message ID issue here**

1. Use existing supabase service layer to build a new 'conversationService' which creates a new conversation item in supabase (pretty sure it uses convID, userID, timeOfCreation and a few other metadata items without checking)
2. Add logic on app/index to fetch the 5 most recently updated conversations

## Changelog

#### 27-12-2024

**Router (llm.py) Changes:**

Moved WebSocket acceptance to the router level only
Added explicit connection confirmation message
Improved error logging and handling

**ConversationService (conversation_service.py) Changes:**

Removed redundant WebSocket acceptance logic
Simplified the message processing flow
Added better error context in logs

**WebSocketService (Frontend) Changes:**

Added proper connection status handling
Improved error and close event logging
Added better state management for connections

**MessageContext Changes:**

Split WebSocket and Stream handling into separate useEffects for better modularity
Added proper cleanup with removeAllListeners
Improved connection state management
Fixed reconnection logic to prevent rapid reconnect attempts

**StreamHandler Changes:**

Added removeAllListeners support
Maintained proper TypeScript typings
Kept consistent with EventEmitter3 patterns

The key issues resolved were:

Double WebSocket acceptance attempts
Improper connection state management
Missing cleanup on unmount
Reconnection logic causing rapid reconnect cycles
