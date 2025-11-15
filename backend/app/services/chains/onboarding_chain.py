import re
import json
import logging
from typing import Dict, Any, Optional, AsyncGenerator
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_google_vertexai import ChatVertexAI
from .base_conversation_chain import BaseConversationChain

logger = logging.getLogger(__name__)

# System prompt for onboarding
ONBOARDING_SYSTEM_PROMPT = """You are a friendly fitness onboarding assistant helping new users set up their profile.

Your goal is to collect the following information through natural conversation:
1. Full name (first and last name)
2. Age (must be a valid number)
3. Unit system preference (imperial/lb or metric/kg)
4. Fitness goals
5. Current abilities/experience level
6. Training preferences

CONVERSATION GUIDELINES:
- Be warm, encouraging, and conversational
- Ask one question at a time naturally
- If the user provides multiple pieces of info at once, acknowledge all of it
- Validate age is numeric - if not, politely ask again
- For unit system, accept variations like "imperial", "pounds", "lb", "metric", "kg", "kilograms"
- Keep responses concise (2-3 sentences max per response)
- Once you have all information, confirm it back to them and let them know they're all set

DATA EXTRACTION:
When you have collected ALL required information, you must output a JSON block in this exact format:

```json
{
  "type": "onboarding_complete",
  "data": {
    "first_name": "John",
    "last_name": "Doe",
    "age": 25,
    "is_imperial": true,
    "goals": "Build muscle and improve overall fitness",
    "current_stats": "Beginner, working out 2-3 times per week",
    "preferences": "Prefer gym workouts with barbells and dumbbells"
  }
}
```

IMPORTANT:
- is_imperial should be true for imperial/pounds/lb, false for metric/kg
- goals, current_stats, and preferences should be free-text strings summarizing what the user told you
- Only output this JSON when you have ALL six pieces of information
- After outputting the JSON, thank them warmly

Start the conversation by greeting them and asking for their name."""


class OnboardingChain(BaseConversationChain):
    """
    Onboarding conversation chain for collecting user profile information.
    
    Collects:
    - Full name (first_name, last_name)
    - Age (numeric validation)
    - Unit system (is_imperial: boolean)
    - Goals (free text)
    - Current abilities (free text)
    - Training preferences (free text)
    """
    
    def __init__(self, llm: ChatVertexAI, user_id: str):
        super().__init__(llm)
        self.user_id = user_id
        self.profile_data: Optional[Dict[str, Any]] = None
        self.is_complete = False
        
        # Initialize prompt template
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", ONBOARDING_SYSTEM_PROMPT),
            MessagesPlaceholder(variable_name="messages"),
            ("human", "{input}")
        ])
        
        logger.info(f"OnboardingChain initialized for user: {user_id}")
    
    async def process_message(self, message: str) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Process message and check for completion data.
        
        Extends base class to add profile data extraction.
        """
        try:
            # Get formatted prompt
            formatted_prompt = await self.get_formatted_prompt(message)
            
            # Stream response
            full_response = ""
            async for chunk in self.chat_model.astream(input=formatted_prompt):
                chunk_content = chunk.content
                if chunk_content:
                    full_response += chunk_content
                    yield {
                        "type": "content",
                        "data": chunk_content
                    }
            
            # Check for profile data in response
            await self._extract_profile_data(full_response)
            
            # If profile data extracted, send it to frontend
            if self.profile_data:
                yield {
                    "type": "onboarding_complete",
                    "data": self.profile_data
                }
                self.is_complete = True
                logger.info(f"Onboarding complete for user {self.user_id}: {self.profile_data}")
            
            # Send completion signal
            yield {
                "type": "complete",
                "data": {"length": len(full_response)}
            }
            
            # Add messages to history
            self.messages.append(HumanMessage(content=message))
            self.messages.append(AIMessage(content=full_response))
            
        except Exception as e:
            logger.error(f"Error processing onboarding message: {str(e)}", exc_info=True)
            yield {
                "type": "error",
                "data": "An error occurred while processing your message"
            }
    
    async def _extract_profile_data(self, response: str) -> None:
        """Extract profile data from JSON block in LLM response."""
        try:
            # Look for JSON code blocks
            json_pattern = r'```json\s*(.*?)\s*```'
            json_matches = re.findall(json_pattern, response, re.DOTALL)
            
            for json_str in json_matches:
                try:
                    parsed_json = json.loads(json_str.strip())
                    
                    # Check if this is onboarding completion data
                    if parsed_json.get('type') == 'onboarding_complete' and 'data' in parsed_json:
                        profile = parsed_json['data']
                        
                        # Validate required fields
                        if self._validate_profile_data(profile):
                            self.profile_data = profile
                            logger.info(f"✅ Profile data extracted and validated for user {self.user_id}")
                            break
                        else:
                            logger.warning("❌ Profile data validation failed")
                    
                except json.JSONDecodeError as e:
                    logger.warning(f"Failed to parse JSON in response: {e}")
                    continue
                    
        except Exception as e:
            logger.error(f"Error extracting profile data: {str(e)}", exc_info=True)
    
    def _validate_profile_data(self, profile: dict) -> bool:
        """Validate that profile data has all required fields with correct types."""
        try:
            required_fields = {
                'first_name': str,
                'last_name': str,
                'age': int,
                'is_imperial': bool,
                'goals': str,
                'current_stats': str,
                'preferences': str
            }
            
            # Check all required fields exist
            for field, expected_type in required_fields.items():
                if field not in profile:
                    logger.warning(f"Missing required field: {field}")
                    return False
                
                # Type validation
                value = profile[field]
                if not isinstance(value, expected_type):
                    logger.warning(f"Invalid type for {field}: expected {expected_type}, got {type(value)}")
                    return False
                
                # Additional validations
                if field == 'age' and (value < 13 or value > 120):
                    logger.warning(f"Age out of valid range: {value}")
                    return False
                
                if expected_type == str and not value.strip():
                    logger.warning(f"Empty string for required field: {field}")
                    return False
            
            logger.info("✅ Profile data validation passed")
            return True
            
        except Exception as e:
            logger.error(f"Error validating profile data: {str(e)}")
            return False
    
    async def get_formatted_prompt(self, message: str):
        """Format the onboarding prompt with conversation history."""
        return self.prompt.format_messages(
            messages=self.messages,
            input=message
        )