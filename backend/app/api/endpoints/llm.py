import logging
import os
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic
from ...services.onboarding_service import OnboardingService
from ...services.llm_conversation_service import ConversationService
from ...core.supabase.client import SupabaseClient
from ...services.workout_analysis_service import WorkoutAnalysisService

router = APIRouter()
load_dotenv()

# Base user connection
@router.websocket("/base/{user_id}")
async def user_base_websocket(websocket: WebSocket, user_id: str):
    logger = logging.getLogger(__name__)
    
    try:
        await websocket.accept()
        logger.info(f"Base WebSocket connection accepted for user: {user_id}")
        
        # Send connection confirmation
        await websocket.send_json({
            "type": "connection_status",
            "data": "connected"
        })
        
        # Handle user-level events
        while True:
            data = await websocket.receive_json()

            if data.get('type') == 'heartbeat':
                await websocket.send_json({
                    "type": "heartbeat_ack",
                    "timestamp": data.get('timestamp')
                })
                continue
            
    except WebSocketDisconnect:
        logger.info(f"Base WebSocket disconnected for user: {user_id}")
    except Exception as e:
        logger.error(f"Error in base user websocket: {str(e)}", exc_info=True)
        try:
            await websocket.close(code=1011)
        except:
            pass


@router.websocket("/onboarding")
async def onboarding_websocket(websocket: WebSocket):
    """Handles the onboarding chat flow"""
    logger = logging.getLogger(__name__)
    api_key = os.getenv("ANTHROPIC_API_KEY")
    
    try:
        await websocket.accept()
        logger.info("WebSocket connection accepted")

        await websocket.send_json({
            "type": "connection_status",
            "data": "connected"
        })
        
        
        # Initialize LLM instance
        llm = ChatAnthropic(
            model="claude-3-7-sonnet-20250219",
            streaming=True,
            api_key=api_key,
            max_retries=0
        )
        
        # Create service with LLM
        service = OnboardingService(llm=llm)

             # Process WebSocket messages
        while True:
            data = await websocket.receive_json()
            
            # Handle heartbeat messages
            if data.get('type') == 'heartbeat':
                await websocket.send_json({
                    "type": "heartbeat_ack",
                    "timestamp": data.get('timestamp')
                })
                continue
            await service.process_message(websocket, data)
        
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"Error in onboarding websocket: {str(e)}", exc_info=True)
        try:
            await websocket.close(code=1011)
        except:
            pass
        raise

@router.websocket("/{conversation_type}/{conversation_id}")
async def conversation_websocket(websocket: WebSocket, conversation_type: str, conversation_id: str):
    logger = logging.getLogger(__name__)
    
    try:
        await websocket.accept()
        logger.info(f"WebSocket connection accepted for {conversation_type}: {conversation_id}")
        
        await websocket.send_json({
            "type": "connection_status",
            "data": "connected"
        })
        
        # Get API key
        api_key = os.getenv("ANTHROPIC_API_KEY")
        
        # Handle different conversation types
        if conversation_type == "default":
            # Default conversation handling (unchanged)
            service = ConversationService(api_key=api_key)
            
            # Process messages directly
            while True:
                data = await websocket.receive_json()
                
                # Handle heartbeat
                if data.get('type') == 'heartbeat':
                    await websocket.send_json({
                        "type": "heartbeat_ack",
                        "timestamp": data.get('timestamp')
                    })
                    continue
                
                # Process message
                await service.process_message(websocket, data)
                
        elif conversation_type == "workout-analysis":
            # Initialize LLM and services
            llm = ChatAnthropic(
                model="claude-3-7-sonnet-20250219",
                streaming=True,
                api_key=api_key,
                max_retries=0
            )
            supabase_client = SupabaseClient()
            service = WorkoutAnalysisService(llm=llm, supabase_client=supabase_client)
            
            # Wait for first message to determine if new or existing conversation
            initial_data = await websocket.receive_json()
            
            # Handle new conversation with workout data
            if initial_data.get('type') == 'analyze_workout' and initial_data.get('data'):
                logger.info("Processing new workout analysis")
                await service.process_message(websocket, initial_data, conversation_id)
                
            # Handle existing conversation - restore context
            else:
                try:
                    logger.info(f"Restoring conversation context for {conversation_id}")
                    
                    # Get messages and bundle data
                    messages = await supabase_client.fetch_conversation_messages(conversation_id)
                    logger.info(f"Retrieved {len(messages)} messages for conversation {conversation_id}")
                    
                    # Get bundle ID and data
                    bundle_id = await supabase_client.get_conversation_bundle_id(conversation_id)
                    logger.info(f"Conversation bundle ID: {bundle_id}")
                    
                    bundle_data = None
                    if bundle_id:
                        bundle_data = await supabase_client.get_workout_bundle(bundle_id)
                        if bundle_data:
                            logger.info(f"Bundle data retrieved, keys: {list(bundle_data.keys())}")
                        else:
                            logger.info(f"No bundle data found for bundle ID: {bundle_id}")
                    else:
                        logger.info("No bundle ID found for conversation")
                    
                    # Initialize conversation
                    await service._handle_initialization(messages, conversation_id)
                    logger.info(f"Initialized conversation with {len(messages)} messages")
                    
                    # Add bundle to context if available
                    if bundle_data:
                        try:
                            from app.schemas.workout_data_bundle import WorkoutDataBundle
                            workout_bundle = WorkoutDataBundle(**bundle_data)
                            logger.info(f"Initialized workout bundle: {workout_bundle.bundle_id}")
                            
                            success = await service.conversation_chain.add_data_bundle(workout_bundle)
                            logger.info(f"Added workout bundle to conversation context: {success}")
                            
                            # Send bundle to client
                            await websocket.send_json({
                                "type": "workout_data_bundle",
                                "data": bundle_data
                            })
                            logger.info("Sent workout bundle to client")
                        except Exception as e:
                            logger.error(f"Error processing workout bundle: {str(e)}", exc_info=True)
                    
                    # Send initialization complete notification instead of processing initial message
                    await websocket.send_json({
                        "type": "initialization_complete",
                        "data": {
                            "message_count": len(messages),
                            "has_bundle": bundle_data is not None
                        }
                    })
                        
                except Exception as e:
                    logger.error(f"Error restoring conversation: {str(e)}", exc_info=True)
                    # Continue with empty context
            
            # Process subsequent messages
            while True:
                data = await websocket.receive_json()
                
                # Handle heartbeat
                if data.get('type') == 'heartbeat':
                    await websocket.send_json({
                        "type": "heartbeat_ack",
                        "timestamp": data.get('timestamp')
                    })
                    continue
                
                # Process message
                logger.info(f"Processing message of type: {data.get('type')}")
                await service.process_message(websocket, data, conversation_id)
                
        else:
            await websocket.close(code=1008, reason="Invalid conversation type")
            return
            
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for {conversation_type}: {conversation_id}")
    except Exception as e:
        logger.error(f"Error in {conversation_type} websocket: {str(e)}", exc_info=True)
        try:
            await websocket.close(code=1011)
        except:
            pass