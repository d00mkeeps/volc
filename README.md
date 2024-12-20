# Welcome

Current objective:

1. Fix stutter issues on ChatUI wrappers
2. Add conversation creation
3. Add message persistence to conversations

**1. Fix stutter issues!**
This is driving me insane...
I've refactored chatui and child components, as well as the [id] page. I suspect the issue lies in the \_layout files which each app routing subdirectory contains except /conversation.

If this continues for another 6 hours of development time, it may be time for drastic adjustments (gifted chat, update an older implementation)

**2. Conversation creation!**
This is exciting! I'm already assigning a uuid to each newly created conversation, the next steps would look at follows:

1. Use existing supabase service layer to build a new 'conversationService' which creates a new conversation item in supabase (pretty sure it uses convID, userID, TimeOfCreation and a few other metadata items without checking)
2. Add logic on app/index to fetch the 5 most recently updated conversations
