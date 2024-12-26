# Welcome

Current objectives:

### Conversation creation!

This is exciting! I'm already assigning a uuid to each newly created conversation, the next steps would look at follows:

**Note: fix the message ID issue here**

1. Use existing supabase service layer to build a new 'conversationService' which creates a new conversation item in supabase (pretty sure it uses convID, userID, timeOfCreation and a few other metadata items without checking)
2. Add logic on app/index to fetch the 5 most recently updated conversations
