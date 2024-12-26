# Welcome

Current objectives:

1. Bug fixes:

- Fix ChatUI in welcome modal
- Solve message key issue with uuid
- inputarea on /index needs rethunk

2. Add conversation creation
3. Add message persistence to conversations

**2. Conversation creation!**
This is exciting! I'm already assigning a uuid to each newly created conversation, the next steps would look at follows:

1. Use existing supabase service layer to build a new 'conversationService' which creates a new conversation item in supabase (pretty sure it uses convID, userID, TimeOfCreation and a few other metadata items without checking)
2. Add logic on app/index to fetch the 5 most recently updated conversations
