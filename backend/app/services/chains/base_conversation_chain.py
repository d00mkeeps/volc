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
            ("system", "{system_prompt}"),
            MessagesPlaceholder(variable_name="messages"),
            ("human", "{current_message}"),
        ]).partial(system_prompt=self.system_prompt)

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
        try:
            # Get prompt variables including any from child classes
            # Note: We don't add the message to history yet to avoid duplication
            prompt_vars = await self.get_additional_prompt_vars()
            prompt_vars["current_message"] = message
            
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
                
                # Check if this is a completion chunk
                if (not chunk.content and 
                    getattr(chunk, 'response_metadata', {}).get('stop_reason') == 'end_turn'):
                    yield {
                        "type": "done",
                        "data": ""
                    }
                    continue
                    
                chunk_content = chunk.content
                if chunk_content:  # Only send non-empty content chunks
                    full_response += chunk_content
                    yield {
                        "type": "content",
                        "data": chunk_content
                    }

            # Only add both messages to history after successful processing
            self.messages.append(HumanMessage(content=message))
            self.messages.append(AIMessage(content=full_response))
            
            logger.debug("\n=== Final Conversation State ===")
            logger.debug(f"Total messages: {len(self.messages)}")
            logger.debug("=====================")
                
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}", exc_info=True)
            yield {
                "type": "error",
                "data": "An error occurred while processing your message"
            }

    def load_conversation_context(self, context) -> None:
        """Load messages from ConversationContext and clear any existing history"""
        from app.core.utils.conversation_attachments import ConversationContext
        
        if isinstance(context, ConversationContext):
            self.messages = context.messages.copy()
            logger.info(f"Loaded {len(self.messages)} messages into conversation history")
        else:
            logger.error("Invalid context type provided to load_conversation_context")
            raise ValueError("Context must be a ConversationContext object")