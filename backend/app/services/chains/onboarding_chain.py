# import re
# import json
# import logging
# from typing import Dict, Any, Optional, AsyncGenerator
# from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
# from langchain_core.messages import HumanMessage, AIMessage
# from langchain_google_vertexai import ChatVertexAI
# from .base_conversation_chain import BaseConversationChain

# logger = logging.getLogger(__name__)

# ONBOARDING_SYSTEM_PROMPT = """You are helping a new user set up their fitness profile through conversation.

# You need to collect:
# - First and last name
# - Age (numeric, between 13-120)
# - Unit preference (imperial/lb or metric/kg)
# - Their fitness goals
# - Current fitness level/experience
# - Training preferences (equipment, location, style)

# Don't list these requirements. Just have a conversation and gather the information naturally.

# Once you have all the information, present it back to the user in this exact JSON format for confirmation:
# ```json
# {{
#   "type": "onboarding_complete",
#   "data": {{
#     "first_name": "their first name",
#     "last_name": "their last name",
#     "age": 25,
#     "is_imperial": false,
#     "goals": {{
#       "content": "their fitness goals as a string"
#     }},
#     "current_stats": "their current fitness level/experience",
#     "preferences": "their training preferences"
#   }}
# }}
# ```

# IMPORTANT TYPE REQUIREMENTS:
# - age: Must be an integer (not "25.0", just 25)
# - is_imperial: Must be a boolean (true for imperial/lb, false for metric/kg)
# - goals: Must be an object with a "content" key containing their goals as a string
# - All other fields: strings

# After showing the JSON, ask them to confirm the information is correct.

# Start by asking their name."""
# class OnboardingChain(BaseConversationChain):
#     """
#     Onboarding conversation chain for collecting user profile information.
    
#     Collects:
#     - Full name (first_name, last_name)
#     - Age (numeric validation)
#     - Unit system (is_imperial: boolean)
#     - Goals (free text)
#     - Current abilities (free text)
#     - Training preferences (free text)
#     """
    
#     def __init__(self, llm: ChatVertexAI, user_id: str):
#         super().__init__(llm)
#         self.user_id = user_id
#         self.profile_data: Optional[Dict[str, Any]] = None
#         self.is_complete = False
        
#         # Initialize prompt template
#         self.prompt = ChatPromptTemplate.from_messages([
#             ("system", ONBOARDING_SYSTEM_PROMPT),
#             MessagesPlaceholder(variable_name="messages"),
#             ("human", "{input}")
#         ])
        
#         logger.info(f"OnboardingChain initialized for user: {user_id}")
    
#     async def process_message(self, message: str) -> AsyncGenerator[Dict[str, Any], None]:
#         """
#         Process message and check for completion data.
        
#         Extends base class to add profile data extraction.
#         """
#         try:
#             # Get formatted prompt
#             formatted_prompt = await self.get_formatted_prompt(message)
            
#             # Stream response
#             full_response = ""
#             async for chunk in self.chat_model.astream(input=formatted_prompt):
#                 chunk_content = chunk.content
#                 if chunk_content:
#                     full_response += chunk_content
#                     yield {
#                         "type": "content",
#                         "data": chunk_content
#                     }
            
#             # Check for profile data in response
#             await self._extract_profile_data(full_response)
            
#             # If profile data extracted, send it to frontend
#             if self.profile_data:
#                 yield {
#                     "type": "onboarding_complete",
#                     "data": self.profile_data
#                 }
#                 self.is_complete = True
#                 logger.info(f"Onboarding complete for user {self.user_id}: {self.profile_data}")
            
#             # Send completion signal
#             yield {
#                 "type": "complete",
#                 "data": {"length": len(full_response)}
#             }
            
#             # Add messages to history
#             self.messages.append(HumanMessage(content=message))
#             self.messages.append(AIMessage(content=full_response))
            
#         except Exception as e:
#             logger.error(f"Error processing onboarding message: {str(e)}", exc_info=True)
#             yield {
#                 "type": "error",
#                 "data": "An error occurred while processing your message"
#             }
    
#     async def _extract_profile_data(self, response: str) -> None:
#         """Extract profile data from JSON block in LLM response."""
#         try:
#             # Look for JSON code blocks
#             json_pattern = r'```json\s*(.*?)\s*```'
#             json_matches = re.findall(json_pattern, response, re.DOTALL)
            
#             for json_str in json_matches:
#                 try:
#                     parsed_json = json.loads(json_str.strip())
                    
#                     # Check if this is onboarding completion data
#                     if parsed_json.get('type') == 'onboarding_complete' and 'data' in parsed_json:
#                         profile = parsed_json['data']
                        
#                         # Validate and sanitize the data
#                         sanitized_profile = self._sanitize_profile_data(profile)
                        
#                         if sanitized_profile and self._validate_profile_data(sanitized_profile):
#                             self.profile_data = sanitized_profile
#                             logger.info(f"✅ Profile data extracted and validated for user {self.user_id}")
#                             break
#                         else:
#                             logger.warning("❌ Profile data validation failed")
                    
#                 except json.JSONDecodeError as e:
#                     logger.warning(f"Failed to parse JSON in response: {e}")
#                     continue
                    
#         except Exception as e:
#             logger.error(f"Error extracting profile data: {str(e)}", exc_info=True)
    
#     def _sanitize_profile_data(self, profile: dict) -> Optional[dict]:
#         """Sanitize and convert profile data to correct types."""
#         try:
#             sanitized = {}
            
#             # String fields - strip whitespace
#             for field in ['first_name', 'last_name', 'goals', 'current_stats', 'preferences']:
#                 if field not in profile:
#                     logger.warning(f"Missing required field: {field}")
#                     return None
#                 value = str(profile[field]).strip()
#                 if not value:
#                     logger.warning(f"Empty string for required field: {field}")
#                     return None
#                 sanitized[field] = value
            
#             # Age - convert to integer
#             if 'age' not in profile:
#                 logger.warning("Missing required field: age")
#                 return None
#             try:
#                 age = int(float(profile['age']))  # Handle both 21 and 21.0
#                 if age < 13 or age > 120:
#                     logger.warning(f"Age out of valid range: {age}")
#                     return None
#                 sanitized['age'] = age
#             except (ValueError, TypeError):
#                 logger.warning(f"Invalid age value: {profile['age']}")
#                 return None
            
#             # Boolean field
#             if 'is_imperial' not in profile:
#                 logger.warning("Missing required field: is_imperial")
#                 return None
#             sanitized['is_imperial'] = bool(profile['is_imperial'])
            
#             logger.info("✅ Profile data sanitized successfully")
#             return sanitized
            
#         except Exception as e:
#             logger.error(f"Error sanitizing profile data: {str(e)}")
#             return None
    
#     def _validate_profile_data(self, profile: dict) -> bool:
#         """Validate that profile data has all required fields with correct types."""
#         try:
#             required_fields = {
#                 'first_name': str,
#                 'last_name': str,
#                 'age': int,
#                 'is_imperial': bool,
#                 'goals': str,
#                 'current_stats': str,
#                 'preferences': str
#             }
            
#             # Check all required fields exist with correct types
#             for field, expected_type in required_fields.items():
#                 if field not in profile:
#                     logger.warning(f"Missing required field: {field}")
#                     return False
                
#                 if not isinstance(profile[field], expected_type):
#                     logger.warning(f"Invalid type for {field}: expected {expected_type}, got {type(profile[field])}")
#                     return False
            
#             logger.info("✅ Profile data validation passed")
#             return True
            
#         except Exception as e:
#             logger.error(f"Error validating profile data: {str(e)}")
#             return False
    
#     async def get_formatted_prompt(self, message: str):
#         """Format the onboarding prompt with conversation history."""
#         return self.prompt.format_messages(
#             messages=self.messages,
#             input=message
#         )