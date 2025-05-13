import pytest
import os
import uuid
from datetime import datetime
from dotenv import load_dotenv
from app.services.db.conversation_service import ConversationService
from app.core.supabase.client import SupabaseClient
from pprint import pprint
from supabase import create_client

@pytest.fixture
def supabase_client():
    """Create an authenticated Supabase client for testing."""
    load_dotenv()
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    
    client = create_client(url, key)
    
    # Authenticate as test user
    auth_response = client.auth.sign_in_with_password({
        "email": "mihithrowaway@gmail.com",
        "password": "qwerty"
    })
    
    return client

@pytest.fixture
def conversation_service(supabase_client):
    """Create an instance of ConversationService with an authenticated client."""
    service = ConversationService()
    # Replace the service's client with our authenticated client
    service._supabase = supabase_client
    return service

@pytest.mark.asyncio
async def test_create_and_retrieve_conversation(conversation_service, supabase_client):
    """Test creating a conversation and retrieving it."""
    # Get authenticated user ID
    user_id = supabase_client.auth.get_user().user.id
    print(f"\nUsing authenticated user ID: {user_id}")
    
    # Create test data
    title = f"Test Conversation {uuid.uuid4()}"
    first_message = "Hello, this is a test message!"
    config_name = "default"
    
    # Create the conversation
    conversation = await conversation_service.create_conversation(
        user_id=user_id,
        title=title,
        first_message=first_message,
        config_name=config_name
    )
    
    print("\nCreate conversation result:")
    pprint(conversation)
    
    # Assert the conversation was created successfully
    assert conversation is not None
    assert "error" not in conversation
    assert conversation.get("user_id") == user_id
    assert conversation.get("title") == title
    assert conversation.get("status") == "active"
    
    conversation_id = conversation.get("id")
    
    # Retrieve the conversation to verify
    retrieved_conversation = await conversation_service.get_conversation(conversation_id)
    
    print("\nRetrieved conversation:")
    pprint(retrieved_conversation)
    
    # Assert the conversation was retrieved correctly
    assert retrieved_conversation is not None
    assert retrieved_conversation.get("id") == conversation_id
    assert retrieved_conversation.get("title") == title
    
    # Get conversation messages to verify the first message was saved
    messages = await conversation_service.get_conversation_messages(conversation_id)
    
    print(f"\nRetrieved {len(messages)} messages:")
    if messages:
        print("First message:")
        pprint(messages[0])
    
    # Assert the message was saved correctly
    assert len(messages) >= 1
    assert messages[0].get("content") == first_message
    assert messages[0].get("conversation_id") == conversation_id
    
    return user_id, conversation_id

@pytest.mark.asyncio
async def test_save_and_retrieve_message(conversation_service, supabase_client):
    """Test saving a message to a conversation and retrieving it."""
    # First create a conversation
    user_id, conversation_id = await test_create_and_retrieve_conversation(conversation_service, supabase_client)
    
    # Create test data for the new message
    content = f"This is a follow-up message {uuid.uuid4()}"
    sender = "user"
    
    # Save the message
    message = await conversation_service.save_message(
        conversation_id=conversation_id,
        content=content,
        sender=sender
    )
    
    print("\nSave message result:")
    pprint(message)
    
    # Assert the message was saved successfully
    assert message is not None
    assert "error" not in message
    assert message.get("conversation_id") == conversation_id
    assert message.get("content") == content
    assert message.get("sender") == sender
    
    # Retrieve all messages to verify
    messages = await conversation_service.get_conversation_messages(conversation_id)
    
    print(f"\nRetrieved {len(messages)} messages:")
    for idx, msg in enumerate(messages):
        print(f"Message {idx + 1}:")
        pprint(msg)
    
    # Assert the new message was retrieved correctly
    assert len(messages) >= 2  # First message + new message
    
    # The new message should be the last one due to conversation_sequence
    new_message = messages[-1]
    assert new_message.get("content") == content
    assert new_message.get("sender") == sender
    
    return user_id, conversation_id

@pytest.mark.asyncio
async def test_get_user_conversations(conversation_service, supabase_client):
    """Test retrieving all active conversations for a user."""
    # First create a conversation
    user_id, conversation_id = await test_save_and_retrieve_message(conversation_service, supabase_client)
    
    # Get all conversations for the user
    conversations = await conversation_service.get_user_conversations(user_id)
    
    print(f"\nRetrieved {len(conversations)} active conversations:")
    for idx, conv in enumerate(conversations[:3]):  # Show only first 3 for brevity
        print(f"Conversation {idx + 1}:")
        pprint(conv)
    
    # Assert we retrieved at least one conversation (the one we just created)
    assert len(conversations) >= 1
    
    # Find our test conversation in the list
    test_conversation = next((c for c in conversations if c.get("id") == conversation_id), None)
    
    # Assert our test conversation is in the list
    assert test_conversation is not None
    
    return user_id, conversation_id

@pytest.mark.asyncio
async def test_delete_conversation(conversation_service, supabase_client):
    """Test deleting a conversation."""
    # First get a conversation
    user_id, conversation_id = await test_get_user_conversations(conversation_service, supabase_client)
    
    # Delete the conversation
    delete_result = await conversation_service.delete_conversation(conversation_id)
    
    print("\nDelete conversation result:")
    pprint(delete_result)
    
    # Assert deletion was successful
    assert delete_result is not None
    assert delete_result.get("success") is True
    assert delete_result.get("id") == conversation_id
    
    # Retrieve the conversation to verify its status changed to 'deleted'
    deleted_conversation = await conversation_service.get_conversation(conversation_id)
    
    print("\nDeleted conversation:")
    pprint(deleted_conversation)
    
    # Assert the conversation now has 'deleted' status
    assert deleted_conversation is not None
    assert deleted_conversation.get("status") == "deleted"
    
    # Get user conversations and verify our deleted conversation isn't in the active list
    active_conversations = await conversation_service.get_user_conversations(user_id)
    deleted_in_active = next((c for c in active_conversations if c.get("id") == conversation_id), None)
    
    # Assert our deleted conversation is not in the active list
    assert deleted_in_active is None

@pytest.mark.asyncio
async def test_create_onboarding_conversation(conversation_service, supabase_client):
    """Test creating an onboarding conversation with a specific ID."""
    # Get authenticated user ID
    user_id = supabase_client.auth.get_user().user.id
    
    # Create test data
    session_id = str(uuid.uuid4())
    config_name = "onboarding"
    
    # Create the onboarding conversation
    conversation = await conversation_service.create_onboarding_conversation(
        user_id=user_id,
        session_id=session_id,
        config_name=config_name
    )
    
    print("\nCreate onboarding conversation result:")
    pprint(conversation)
    
    # Assert the conversation was created successfully
    assert conversation is not None
    assert "error" not in conversation
    assert conversation.get("id") == session_id
    assert conversation.get("user_id") == user_id
    assert conversation.get("title") == "Onboarding Session"
    assert conversation.get("config_name") == config_name
    assert conversation.get("status") == "active"
    
    # Retrieve the conversation to verify
    retrieved_conversation = await conversation_service.get_conversation(session_id)
    
    print("\nRetrieved onboarding conversation:")
    pprint(retrieved_conversation)
    
    # Assert the conversation was retrieved correctly
    assert retrieved_conversation is not None
    assert retrieved_conversation.get("id") == session_id
    assert retrieved_conversation.get("title") == "Onboarding Session"