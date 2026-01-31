import logging
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from app.services.llm.base import BaseLLMService, is_rate_limit_error

from app.services.db.message_service import MessageService
from app.services.db.user_profile_service import UserProfileService

logger = logging.getLogger(__name__)


class MemoryNote(BaseModel):
    text: str = Field(..., description="Single sentence fact")
    date: str = Field(..., description="ISO date string")
    category: str = Field(
        ...,
        description="Category: goal|injury|preference|equipment|nutrition|recovery|general",
    )


class MemoryUpdate(BaseModel):
    thought: str = Field(
        ...,
        description="Internal step-by-step reasoning about the merge logic, conflicts, and categorization decisions",
    )
    notes: List[MemoryNote] = Field(..., description="List of memory notes")


import os

MEMORY_REASONING_LOG = os.path.join(
    os.path.dirname(__file__),
    "..",
    "..",
    "..",
    "testing",
    "logs",
    "memory_reasoning.log",
)
os.makedirs(os.path.dirname(MEMORY_REASONING_LOG), exist_ok=True)


class MemoryExtractionService(BaseLLMService):
    """
    Service for extracting long-term memory from conversations.
    """

    def __init__(self, credentials=None, project_id=None):
        super().__init__(
            model_name="gemini-2.5-flash",
            temperature=0,
            credentials=credentials,
            project_id=project_id,
        )
        self.message_service = MessageService()
        self.user_profile_service = UserProfileService()

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
            1. REASON: First, analyze the conversation and think step-by-step about what has changed. Note conflicts or new facts in your `thought` field.
            2. MERGE: Create a comprehensive list of notes by merging new info with CURRENT MEMORY.
            
            3. Rules for merging:
            - Add NEW notes with the current date: {current_date}
            - If the user RECONFIRMS existing info, keep the text identical but update the date to {current_date}.
            - If the user CONTRADICTS existing info, DELETE the old note and explain why in your `thought`.
            - If the conversation contained no new relevant info, return the CURRENT MEMORY unchanged.
            
            4. SMART COMBINATION - Combine related facts into single, richer notes:
            - Goals with context: "Squat 200kg at powerlifting competition in June 2025" (NOT separate goal + event notes)
            - Behavioral transitions: "Starting to implement RPE training, beginning with deadlifts" (NOT separate "open to RPE" + "plans to use RPE")
            - Related preferences: Keep the specific note, DELETE vague duplicates
            - Before adding a note, check: Does this overlap with existing notes? Can multiple notes be expressed as one?
            
            5. CONVERSATION SUMMARY NOTES:
            - Notes with category "conversation_summary" are mid-session extractions.
            - Re-categorize them into the appropriate category (goal, injury, preference, etc.).
            - If contradicted by recent messages, DELETE them.
            - Merge with related notes where appropriate.
            
            6. Categories (choose carefully):
            - goal: SMART objectives with timeline (e.g., "Squat 200kg by June 2025")
            - injury: Physical limitations, pain, impingements
            - preference: Training style preferences (frequency, program type, exercise selection, current training approach)
            - equipment: Available equipment
            - nutrition: Diet phase (bulking/cutting), restrictions, calorie targets, macro focus
            - recovery: Sleep quality/schedule, stress levels, fatigue sensitivity, PEDs, supplements
            - general: Competition results, significant training milestones, lifestyle context, scheduling constraints, hobbies, training breaks
            
            7. WHAT TO INCLUDE:
            ✓ Enduring facts (equipment, injuries, long-term preferences)
            ✓ Behavioral snapshots (current training approach - "trains by feel", habits being built - "aims to eat vegetables")
            ✓ Near-term plans (specific intentions for next 1-2 workouts - needed for planning system)
            ✓ Self-awareness notes (patterns user notices about themselves - "sensitive to poor sleep")
            ✓ Nutritional phases (bulking, cutting, maintenance)
            ✓ Training breaks or returns ("8-month break from deadlifting")
            
            8. WHAT TO EXCLUDE:
            ✗ Current ability estimates or training PRs (e.g., "current squat max is 165kg") - these are tracked in workout analytics
            ✗ DO include competition results and personally significant past achievements (e.g., "hit 185kg at regional meet")
            ✗ Vague duplicates when specific notes exist (e.g., don't keep "prioritizes recovery" if you have "prefers extended recovery periods between intense sessions")
            
            9. Each note should be:
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
            logger.info(
                f"Starting memory extraction for user {user_id}, conversation {conversation_id}"
            )

            # 1. Load Conversation History (using admin access since this is a background task)
            messages_result = (
                await self.message_service.get_conversation_messages_admin(
                    conversation_id
                )
            )

            if not messages_result.get("success"):
                logger.warning(
                    f"Failed to load messages for conversation {conversation_id}: {messages_result.get('error')}"
                )
                return

            messages = messages_result.get("data", [])
            if not messages:
                logger.warning(f"No messages found for conversation {conversation_id}")
                return

            # Format conversation for LLM
            conversation_text = "\n".join(
                [f"{msg['sender']}: {msg['content']}" for msg in messages]
            )

            # 2. Load Latest Analysis Bundle (Admin)
            # We need the latest bundle to get the current memory and to update it.
            from app.services.db.context_service import ContextBundleService

            context_service = ContextBundleService()

            bundle_result = await context_service.get_latest_context_bundle_admin(
                user_id
            )

            if not bundle_result.get("success") or not bundle_result.get("data"):
                logger.warning(
                    f"No analysis bundle found for user {user_id}, cannot update memory."
                )
                return

            bundle = bundle_result["data"]
            current_memory = bundle.ai_memory or {"notes": []}

            # 3. Run Extraction Chain with retry logic for 429 errors
            chain = self.prompt | self.llm | self.parser

            current_date = datetime.now().isoformat()

            max_retries = 3
            result = None

            for attempt in range(1): # Manual retry loop removed in favor of base class logic
                try:
                    result = await self._call_with_retry(
                        chain.ainvoke,
                        {
                            "current_memory": json.dumps(current_memory, indent=2),
                            "conversation_history": conversation_text,
                            "current_date": current_date,
                            "format_instructions": self.parser.get_format_instructions(),
                        }
                    )
                    break
                except Exception as e:
                    if not is_rate_limit_error(e):
                        raise
                    # If it gets here after 5 retries in _call_with_retry, it will fail
                    logger.error(f"Rate limit exceeded after base retries for user {user_id}")
                    return

            if result is None:
                logger.error(
                    f"Memory extraction failed after retries for user {user_id}"
                )
                return

            # Log reasoning to file
            with open(MEMORY_REASONING_LOG, "a") as f:
                f.write(
                    f"\n[{datetime.now().isoformat()}] FULL EXTRACTION: User {user_id}, Conv {conversation_id}\n"
                )
                f.write(f"REASONING: {result.get('thought', 'N/A')}\n")
                f.write(
                    f"NOTES ({len(result.get('notes', []))}): {json.dumps(result.get('notes', []), indent=2)}\n"
                )
                f.write(f"{'='*40}\n")

            # 4. Update AI Memory only (not the entire bundle)
            save_result = await context_service.update_ai_memory_admin(
                bundle.id, result
            )

            if save_result.get("success"):
                logger.info(
                    f"Successfully updated memory for user {user_id} in bundle {bundle.id}"
                )
            else:
                logger.error(
                    f"Failed to save memory for user {user_id}: {save_result.get('error')}"
                )

        except Exception as e:
            logger.error(f"Error in memory extraction: {str(e)}", exc_info=True)

    async def append_session_memory(
        self, user_id: str, messages: list[dict], bundle_id: str
    ) -> bool:
        """
        Append-only extraction for mid-conversation compaction.

        Extracts key facts from old messages and appends them as 'conversation_summary'
        notes. These get re-categorized on conversation close by the main extract_memory.

        Args:
            user_id: User's ID
            messages: List of message dicts with 'role' and 'content'
            bundle_id: Bundle ID to append notes to

        Returns:
            True if successful, False otherwise
        """
        try:
            logger.info(
                f"🗜️ Session compaction: extracting from {len(messages)} messages"
            )

            # Format messages for extraction
            conversation_text = "\n".join(
                [f"{msg['role']}: {msg['content']}" for msg in messages]
            )

            # Simple extraction prompt (no merge logic needed)
            simple_prompt = ChatPromptTemplate.from_template(
                """
You are extracting key facts from a conversation segment for memory storage.

CONVERSATION:
{conversation}

RULES:
- REASON: Analyze the segment for enduring facts. Explain your logic in the `thought` field.
- Extract only enduring facts (preferences, injuries, goals, context, decisions made)
- Each note: one clear fact, single sentence
- Focus on information that would be useful in future conversations
- Do NOT categorize yet—all notes get category "conversation_summary"
- If the conversation has no memorable facts, return an empty notes list

OUTPUT FORMAT:
{format_instructions}
"""
            )

            # Use base class retry-wrapped invocation
            result = await self._call_with_retry(
                chain.ainvoke,
                {
                    "conversation": conversation_text,
                    "format_instructions": self.parser.get_format_instructions(),
                }
            )

            # Log reasoning to file
            with open(MEMORY_REASONING_LOG, "a") as f:
                f.write(
                    f"\n[{datetime.now().isoformat()}] SESSION COMPACTION: User {user_id}, Bundle {bundle_id}\n"
                )
                f.write(f"REASONING: {result.get('thought', 'N/A')}\n")
                f.write(
                    f"NOTES ({len(result.get('notes', []))}): {json.dumps(result.get('notes', []), indent=2)}\n"
                )
                f.write(f"{'='*40}\n")

            notes = result.get("notes", [])

            if not notes:
                logger.info("No session notes extracted")
                return True

            # Tag all as conversation_summary with current date
            current_date = datetime.now().isoformat()
            for note in notes:
                note["category"] = "conversation_summary"
                note["date"] = current_date

            # Append to DB
            from app.services.db.context_service import ContextBundleService

            context_service = ContextBundleService()

            save_result = await context_service.append_ai_memory_admin(bundle_id, notes)

            if save_result.get("success"):
                logger.info(
                    f"✅ Appended {len(notes)} session notes to bundle {bundle_id}"
                )
                return True
            else:
                logger.error(
                    f"Failed to append session notes: {save_result.get('error')}"
                )
                return False

        except Exception as e:
            logger.error(f"Error in session memory extraction: {str(e)}", exc_info=True)
            return False
