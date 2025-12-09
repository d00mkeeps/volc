import logging
import json
import re
from typing import List, Dict, Any
from langchain_google_vertexai import ChatVertexAI
from langchain_core.messages import SystemMessage, HumanMessage

from app.services.context.shared_context_loader import SharedContextLoader

logger = logging.getLogger(__name__)

class ChatActionService:
    """
    Service for generating contextual 'Quick Chat Actions' based on user history.
    Uses a lightweight LLM (Gemini 2.5 Flash Lite) for low latency.
    """
    
    def __init__(self, credentials=None, project_id=None):
        self.context_loader = SharedContextLoader()
        
        # Use lightweight model for speed
        self.llm = ChatVertexAI(
            model="gemini-2.5-flash-lite",
            temperature=0.4, # Slightly creative but consistent
            max_output_tokens=150, # Actions are short
            credentials=credentials,
            project=project_id
        )
    
    async def generate_actions(self, user_id: str, messages: List[Dict[str, str]] = None) -> List[str]:
        """
        Generate 3 quick-reply actions based on user context and optional recent messages.
        
        Args:
            user_id: User's ID
            
        Returns:
            List of 3 action strings (e.g. ["Plan Leg Day", "Detailed Analysis", "Log Workout"])
        """
        try:
            # Load context (cached)
            context = await self.context_loader.load_all(user_id)
            bundle = context.get('bundle')
            
            last_workout_info = "None"
            ai_memory_info = "None"
            
            if bundle:
                # Extract Last Workout
                if hasattr(bundle, 'recent_workouts') and bundle.recent_workouts:
                    last = bundle.recent_workouts[0]
                    date_str = last.date.strftime('%Y-%m-%d') if hasattr(last.date, 'strftime') else str(last.date)
                    last_workout_info = f"{last.name} on {date_str}"
                
                # Extract AI Memory
                if hasattr(bundle, 'ai_memory') and bundle.ai_memory:
                    notes = bundle.ai_memory.get('notes', [])
                    # Get last 3 notes
                    recent_notes = [n.get('text', '') for n in notes[-3:]]
                    if recent_notes:
                        ai_memory_info = "; ".join(recent_notes)
            
            logger.info("🔍 [ChatActionService] Context Verification:")
            logger.info(f"   - User ID: {user_id}")
            logger.info(f"   - Last Workout: {last_workout_info}")
            logger.info(f"   - AI Memory: {ai_memory_info[:100]}..." if len(ai_memory_info) > 100 else f"   - AI Memory: {ai_memory_info}")
            if messages:
                logger.info(f"   - Conversation Context: {len(messages)} messages provided")
                if len(messages) > 0:
                     logger.info(f"   - Last Message: {messages[-1].get('content', '')[:50]}...")
            else:
                logger.info("   - Conversation Context: None provided")
            
            # Build formatted context string
            formatted_context = f"""
            Context:
            - Last Workout: {last_workout_info}
            - AI Memory Notes: {ai_memory_info}
            """

            # Add recent conversation context if provided
            recent_chat_context = ""
            if messages:
                # Assuming 'messages' is a list of dicts like [{'sender': 'user', 'content': '...'}]
                formatted_msgs = "\n".join([f"{m.get('sender', 'user')}: {m.get('content', '')}" for m in messages[-5:]]) # Limit to last 5
                recent_chat_context = f"\nRECENT CONVERSATION:\n{formatted_msgs}\n"

            # Build Prompt
            prompt = f"""
            You are an expert fitness coach assistant. Based on this user's context, generate exactly 3 short, punchy "suggested action" buttons that the user might want to click right now.
            
            {formatted_context}
            {recent_chat_context}
            
            RULES:
            1. Output ONLY a valid JSON array of strings. Example: ["Plan workout", "Log cardio", "Ask about diet"]
            2. Keep each action under 4 words.
            3. Make them relevant to the user's current state (e.g., if they just finished a workout, suggest recovery; if it's morning, suggest planning).
            4. Do NOT include markdown formatting or backticks. Just the raw JSON string.
            """
            
            messages = [
                SystemMessage(content="You are a helpful fitness coach assistant. Generate JSON only."),
                HumanMessage(content=prompt)
            ]
            
            # Generate
            response = await self.llm.ainvoke(messages)
            content = response.content
            
            # Extract JSON
            actions = self._parse_json_actions(content)
            
            # Fallback if empty or failed
            if not actions:
                logger.warning(f"⚠️ Empty actions generated for user {user_id}, using defaults")
                return ["Plan Workout", "Analyze Progress", "Just Chatting"]
                
            return actions[:3] # Ensure max 3
            
        except Exception as e:
            logger.error(f"❌ Error generating chat actions: {str(e)}", exc_info=True)
            return ["Plan Workout", "Analyze Progress", "Just Chatting"]
    
    def _parse_json_actions(self, text: str) -> List[str]:
        """Extract and parse JSON list from LLM response"""
        try:
            # Try to find JSON block
            match = re.search(r'\[.*\]', text, re.DOTALL)
            if match:
                json_str = match.group(0)
                actions = json.loads(json_str)
                if isinstance(actions, list) and all(isinstance(a, str) for a in actions):
                    return actions
            return []
        except Exception:
            return []
