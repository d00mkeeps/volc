import json
from typing import AsyncGenerator, Dict, Any, Optional, List
import asyncio
import logging
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, BaseMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

logger = logging.getLogger(__name__)

class BaseConversationChain:
    def __init__(
        self, 
        system_prompt: str, 
        llm: ChatAnthropic
    ):
        self.system_prompt = system_prompt
        self.chat_model = llm
        self.messages: List[BaseMessage] = []
        self._initialize_prompt_template()

    def _initialize_prompt_template(self) -> None:
        """Sets up the base conversation prompt template."""
        self.prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content=self.system_prompt),
            MessagesPlaceholder(variable_name="messages"),
            HumanMessage(content="{current_message}"),
        ]).partial(current_message="")

    async def extract_data(self) -> Any:
        """Optional data extraction - override if needed"""
        return None
        
    async def analyze_sentiment(self, message: str, current_summary: Dict) -> bool:
        """Optional sentiment analysis - override if needed"""
        return False

    async def update_state(self, extracted_data: Any) -> None:
        """Optional state updates - override if needed"""
        pass

    async def get_additional_prompt_vars(self) -> Dict[str, Any]:
        """Get additional variables for prompt formatting - override if needed"""
        return {
            "messages": self.messages,
            "current_message": ""
        }

    async def process_message(self, message: str) -> AsyncGenerator[Dict[str, Any], None]:
        """Process an incoming message and yield response chunks."""
        try:
            # Add message to conversation history
            self.messages.append(HumanMessage(content=message))
            
            # Get prompt variables including any from child classes
            prompt_vars = await self.get_additional_prompt_vars()
            prompt_vars["current_message"] = message
            
            # Debug log the prompt variables
            logger.info("\n=== Prompt Variables ===")
            debug_vars = {
                "context": prompt_vars.get("context"),
                "messages": [{"type": type(m).__name__, "content": m.content} 
                            for m in prompt_vars.get("messages", [])],
                "current_message": prompt_vars.get("current_message")
            }
            logger.info(json.dumps(debug_vars, indent=2))
            logger.info("=====================")
            
            # Format the prompt
            formatted_prompt = self.prompt.format_messages(**prompt_vars)
            
            # Log the formatted messages
            logger.info("\n=== Formatted Messages ===")
            for i, msg in enumerate(formatted_prompt):
                logger.info(f"\nMessage {i+1} ({type(msg).__name__}):")
                logger.info(f"Content: {msg.content}")
            logger.info("=====================")
            
            # Stream the response
            full_response = ""
            async for chunk in self.chat_model.astream(
                input=formatted_prompt
            ):
                chunk_content = chunk.content
                full_response += chunk_content
                yield {
                    "type": "content",
                    "data": chunk_content
                }

            # Add response to conversation history
            self.messages.append(AIMessage(content=full_response))
            
            # Log final conversation state
            logger.info("\n=== Final Conversation State ===")
            logger.info(f"Total messages: {len(self.messages)}")
            logger.info("=====================")
                
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}")
            yield {
                "type": "error",
                "data": "An error occurred while processing your message"
            }