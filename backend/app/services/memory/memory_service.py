import logging
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field

from app.services.db.message_service import MessageService
from app.services.db.user_profile_service import UserProfileService

logger = logging.getLogger(__name__)

class MemoryNote(BaseModel):
    text: str = Field(..., description="Single sentence fact")
    date: str = Field(..., description="ISO date string")
    category: str = Field(..., description="Category: goal|injury|preference|equipment|nutrition|recovery|general")

class MemoryUpdate(BaseModel):
    notes: List[MemoryNote] = Field(..., description="List of memory notes")

class MemoryExtractionService:
    """
    Service for extracting long-term memory from conversations.
    """
    
    def __init__(self, credentials=None, project_id=None):
        self.credentials = credentials
        self.project_id = project_id
        self.message_service = MessageService()
        self.user_profile_service = UserProfileService()
        
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0,
            credentials=credentials,
            project=project_id,
            vertexai=True  # Explicit Vertex AI backend selection
        )
        
        self.parser = JsonOutputParser(pydantic_object=MemoryUpdate)
        

        self.prompt = ChatPromptTemplate.from_template(
            """
            You are an expert memory system for a fitness coaching AI.
            Your goal is to maintain a structured "memory" of the user based on their conversations.
            
            CURRENT MEMORY:
        {current_memory}
            
            RECENT CONVERSATION:
        {conversation_history}
            
            INSTRUCTIONS:
            1. Analyze the recent conversation for any NEW information about the user.
            2. MERGE this new information with the CURRENT MEMORY to create a comprehensive list of notes.
            
            3. Rules for merging:
            - Add NEW notes with the current date: {current_date}
            - If the user RECONFIRMS existing info, keep the text identical but update the date to {current_date}.
            - If the user CONTRADICTS existing info, DELETE the old note.
            - If the conversation contained no new relevant info, return the CURRENT MEMORY unchanged.
            
            4. SMART COMBINATION - Combine related facts into single, richer notes:
            - Goals with context: "Squat 200kg at powerlifting competition in June 2025" (NOT separate goal + event notes)
            - Behavioral transitions: "Starting to implement RPE training, beginning with deadlifts" (NOT separate "open to RPE" + "plans to use RPE")
            - Related preferences: Keep the specific note, DELETE vague duplicates
            - Before adding a note, check: Does this overlap with existing notes? Can multiple notes be expressed as one?
            
            5. Categories (choose carefully):
            - goal: SMART objectives with timeline (e.g., "Squat 200kg by June 2025")
            - injury: Physical limitations, pain, impingements
            - preference: Training style preferences (frequency, program type, exercise selection, current training approach)
            - equipment: Available equipment
            - nutrition: Diet phase (bulking/cutting), restrictions, calorie targets, macro focus
            - recovery: Sleep quality/schedule, stress levels, fatigue sensitivity, PEDs, supplements
            - general: Competition results, significant training milestones, lifestyle context, scheduling constraints, hobbies, training breaks
            
            6. WHAT TO INCLUDE:
            ✓ Enduring facts (equipment, injuries, long-term preferences)
            ✓ Behavioral snapshots (current training approach - "trains by feel", habits being built - "aims to eat vegetables")
            ✓ Near-term plans (specific intentions for next 1-2 workouts - needed for planning system)
            ✓ Self-awareness notes (patterns user notices about themselves - "sensitive to poor sleep")
            ✓ Nutritional phases (bulking, cutting, maintenance)
            ✓ Training breaks or returns ("8-month break from deadlifting")
            
            7. WHAT TO EXCLUDE:
            ✗ Current ability estimates or training PRs (e.g., "current squat max is 165kg") - these are tracked in workout analytics
            ✗ DO include competition results and personally significant past achievements (e.g., "hit 185kg at regional meet")
            ✗ Vague duplicates when specific notes exist (e.g., don't keep "prioritizes recovery" if you have "prefers extended recovery periods between intense sessions")
            
            8. Each note should be:
            - Atomic: One clear fact per note
            - Concise: Single sentence maximum
            - Specific: Include relevant context (dates, numbers, specifics)
            - Combined: Merge related facts when they describe the same thing
            
            EXAMPLES OF GOOD COMBINATION:
            
            Example 1 - Combining Goal + Event:
            ❌ BAD (duplicative):
            - "User aims to squat 200kg by June."
            - "User has a powerlifting competition in June."
            
            ✅ GOOD (combined):
            - "Squat 200kg at powerlifting competition in June 2025."
            
            Example 2 - Combining Behavioral Transition:
            ❌ BAD (duplicative):
            - "User is open to trying RPE for training."
            - "User plans to apply RPE to deadlifts for the next session."
            
            ✅ GOOD (combined):
            - "Starting to implement RPE training, beginning with deadlifts for the next session."
            
            Example 3 - Removing Vague Duplicates:
            ❌ BAD (vague duplicate):
            - "User prefers difficult training sessions and more recovery time."
            - "User prioritizes recovery to avoid fatigue."
            
            ✅ GOOD (keep specific, remove vague):
            - "Prefers high-intensity sessions with extended recovery periods."
            
            Example 4 - What NOT to Store:
            ❌ BAD (current ability - belongs in analytics):
            - "User's current estimated squat max is 165kg."
            
            ✅ GOOD (competition result - belongs in memory):
            - "Run sub-2:00 half-marathon at Robin Hood Marathon in September 2026."
            
            OUTPUT FORMAT:
        {format_instructions}
            """
        )



    async def extract_memory(self, user_id: str, conversation_id: str):
        """
        Extracts memory from a conversation and updates the user's latest analysis bundle.
        This is designed to run as a background task.
        """
        import asyncio
        
        try:
            logger.info(f"Starting memory extraction for user {user_id}, conversation {conversation_id}")
            
            # 1. Load Conversation History (using admin access since this is a background task)
            messages_result = await self.message_service.get_conversation_messages_admin(conversation_id)
            
            if not messages_result.get("success"):
                logger.warning(f"Failed to load messages for conversation {conversation_id}: {messages_result.get('error')}")
                return
                
            messages = messages_result.get("data", [])
            if not messages:
                logger.warning(f"No messages found for conversation {conversation_id}")
                return
            
            # Format conversation for LLM
            conversation_text = "\n".join([f"{msg['sender']}: {msg['content']}" for msg in messages])
            
            # 2. Load Latest Analysis Bundle (Admin)
            # We need the latest bundle to get the current memory and to update it.
            from app.services.db.context_service import ContextBundleService
            context_service = ContextBundleService()
            
            bundle_result = await context_service.get_latest_context_bundle_admin(user_id)
            
            if not bundle_result.get("success") or not bundle_result.get("data"):
                logger.warning(f"No analysis bundle found for user {user_id}, cannot update memory.")
                return
                
            bundle = bundle_result["data"]
            current_memory = bundle.ai_memory or {"notes": []}
            
            # 3. Run Extraction Chain with retry logic for 429 errors
            chain = self.prompt | self.llm | self.parser
            
            current_date = datetime.now().isoformat()
            
            max_retries = 3
            result = None
            
            for attempt in range(max_retries):
                try:
                    result = await chain.ainvoke({
                        "current_memory": json.dumps(current_memory, indent=2),
                        "conversation_history": conversation_text,
                        "current_date": current_date,
                        "format_instructions": self.parser.get_format_instructions()
                    })
                    break  # Success, exit retry loop
                    
                except Exception as e:
                    error_str = str(e).lower()
                    if "429" in str(e) or "resource exhausted" in error_str or "too many requests" in error_str:
                        if attempt < max_retries - 1:
                            wait_time = 2 ** attempt  # Exponential backoff: 1s, 2s, 4s
                            logger.warning(f"Rate limited (429), retrying in {wait_time}s (attempt {attempt + 1}/{max_retries})")
                            await asyncio.sleep(wait_time)
                        else:
                            logger.error(f"Rate limit exceeded after {max_retries} retries for user {user_id}")
                            return
                    else:
                        raise  # Re-raise non-429 errors
            
            if result is None:
                logger.error(f"Memory extraction failed after retries for user {user_id}")
                return
            
            # 4. Update AI Memory only (not the entire bundle)
            save_result = await context_service.update_ai_memory_admin(bundle.id, result)
            
            if save_result.get("success"):
                logger.info(f"Successfully updated memory for user {user_id} in bundle {bundle.id}")
            else:
                logger.error(f"Failed to save memory for user {user_id}: {save_result.get('error')}")
                
        except Exception as e:
            logger.error(f"Error in memory extraction: {str(e)}", exc_info=True)
