import logging
import json
import re
from typing import List, Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI
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
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash-lite",
            max_output_tokens=150, # Actions are short
            credentials=credentials,
            project=project_id
        )
        
    async def generate_actions(self, user_id: str, messages: List[Dict[str, str]] = None) -> Dict[str, Any]:
        """
        Generate 3 quick-reply actions based on user context and optional recent messages,
        with hardcoded placeholder text.
        
        Args:
            user_id: User's ID
            messages: Optional recent conversation messages
            
        Returns:
            Dict containing actions list and placeholder string
        """
        try:
            # Load context (cached)
            context = await self.context_loader.load_all(user_id)
            bundle = context.get('bundle')
            
            last_workout_info = "None"
            ai_memory_info = "None"
            is_early_user = True  # Default to early user
            
            if bundle:
                # Extract Last Workout
                if hasattr(bundle, 'recent_workouts') and bundle.recent_workouts:
                    last = bundle.recent_workouts[0]
                    date_str = last.date.strftime('%Y-%m-%d') if hasattr(last.date, 'strftime') else str(last.date)
                    last_workout_info = f"{last.name} on {date_str}"
                
                # Extract AI Memory and check user status
                if hasattr(bundle, 'ai_memory') and bundle.ai_memory:
                    notes = bundle.ai_memory.get('notes', [])
                    is_early_user = len(notes) < 3
                    
                    # Get last 3 notes
                    recent_notes = [n.get('text', '') for n in notes[-3:]]
                    if recent_notes:
                        ai_memory_info = "; ".join(recent_notes)
            
            logger.info("🔍 [ChatActionService] Context Verification:")
            logger.info(f"   - User ID: {user_id}")
            logger.info(f"   - Is Early User: {is_early_user}")
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
            - User Status: {"Early user (< 3 memory notes)" if is_early_user else "Established user"}
            """

            # Add recent conversation context if provided
            recent_chat_context = ""
            if messages:
                formatted_msgs = "\n".join([f"{m.get('sender', 'user')}: {m.get('content', '')}" for m in messages[-5:]])
                recent_chat_context = f"\nRECENT CONVERSATION:\n{formatted_msgs}\n"

            # Build Prompt - different approach for early users
            if is_early_user:
                prompt = f"""
                You are an expert fitness coach assistant helping onboard a new user. This user has fewer than 3 AI memory notes, so we need to learn more about them.
                
                {formatted_context}
                {recent_chat_context}
                
                Generate exactly 3 short, punchy "suggested action" buttons that guide the user to share:
                - Their fitness goals
                - Their current abilities/fitness level
                - Their preferences (workout style, equipment, time availability)
                - Any injury history or limitations
                
                ONBOARDING EXAMPLES:
                - [{{"label": "Set goals", "message": "I'd like to set some fitness goals"}}, {{"label": "Share abilities", "message": "Let me tell you about my current fitness level"}}, {{"label": "Any injuries?", "message": "I have some injury history to share"}}]
                - [{{"label": "What's my level?", "message": "Help me figure out my fitness level"}}, {{"label": "Equipment access", "message": "Here's what equipment I have access to"}}, {{"label": "Time available", "message": "I want to discuss how much time I have for training"}}]
                
                Make the actions feel natural based on the conversation, but keep the focus on collecting information we need to coach them effectively.
                
                RULES:
                1. Output ONLY a valid JSON array of action objects.
                2. "label" should be short (under 20 chars) for the button.
                3. "message" should be the natural language text sent to chat (can be longer).
                4. Make them relevant to what we still need to learn about the user.
                5. Do NOT include markdown formatting or backticks. Just the raw JSON array.

                Output format: [{{"label": "...", "message": "..."}}, ...]
                """
            else:
                prompt = f"""
                You are an expert fitness coach assistant. Based on this user's context, generate exactly 3 short, punchy "suggested action" buttons that the user might want to click right now.
                
                {formatted_context}
                {recent_chat_context}
                
                EXAMPLES:
                - Analysis Context: [{{"label": "Check depth", "message": "Can you analyze my squat depth?"}}, {{"label": "Compare to last", "message": "How does this compare to my last workout?"}}, {{"label": "Fix form", "message": "What cues can help fix my form?"}}]
                - Planning Context: [{{"label": "Start plan", "message": "Help me create a workout plan"}}, {{"label": "Modify split", "message": "I want to change my current split"}}, {{"label": "What exercises?", "message": "What exercises should I include?"}}]
                - General/Chat: [{{"label": "Continue workout", "message": "Let's continue with my workout"}}, {{"label": "End session", "message": "I'd like to end this workout session"}}, {{"label": "Ask question", "message": "I have a question about my training"}}]

                RULES:
                1. Output ONLY a valid JSON array of action objects.
                2. "label" should be short (under 20 chars) for the button.
                3. "message" should be the natural language text sent to chat (can be longer).
                4. Make them relevant to the user's current state.
                5. Do NOT include markdown formatting or backticks. Just the raw JSON array.

                Output format: [{{"label": "...", "message": "..."}}, ...]
                """
            
            messages_to_send = [
                SystemMessage(content="You are a helpful fitness coach assistant. Generate JSON only."),
                HumanMessage(content=prompt)
            ]
            
            # Generate
            response = await self.llm.ainvoke(messages_to_send)
            content = response.content
            
            # Extract JSON
            actions = self._parse_json_response(content)
            
            if not actions:
                logger.warning(f"⚠️ Empty actions generated for user {user_id}, using defaults")
                # Different defaults for early vs established users
                if is_early_user:
                    actions = [
                        {"label": "Set goals", "message": "I'd like to set some fitness goals"},
                        {"label": "Share abilities", "message": "Let me tell you about my current fitness level"},
                        {"label": "Any limitations?", "message": "I have some injury history or limitations to share"}
                    ]
                else:
                    actions = [
                        {"label": "Continue workout", "message": "Let's continue with my workout"},
                        {"label": "End session", "message": "I'd like to end this workout session"},
                        {"label": "Ask question", "message": "I have a question about my training"}
                    ]
                
            return {
                "actions": actions[:3]  # Ensure max 3
            }
            
        except Exception as e:
            logger.error(f"❌ Error generating chat actions: {str(e)}", exc_info=True)
            return {
                "actions": [
                    {"label": "Continue workout", "message": "Let's continue with my workout"},
                    {"label": "End session", "message": "I'd like to end this workout session"},
                    {"label": "Ask question", "message": "I have a question about my training"}
                ]
            }



    def _parse_json_response(self, text: str) -> List[Dict[str, str]]:
        """Extract and parse JSON array of actions"""
        try:
            match = re.search(r'\[.*\]', text, re.DOTALL)
            if match:
                json_str = match.group(0)
                actions = json.loads(json_str)
                # Validate structure
                if isinstance(actions, list):
                    return actions
            return []
        except Exception:
            return []