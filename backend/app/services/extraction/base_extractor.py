from abc import ABC, abstractmethod
from typing import List, Generic, TypeVar
from langchain_core.messages import HumanMessage, AIMessage
from pydantic import BaseModel

# Create a generic type for our extraction models
T = TypeVar('T', bound=BaseModel)

class BaseExtractor(ABC, Generic[T]):
    """
    Abstract base class for data extractors. This provides a common interface
    for all extractors to implement, ensuring consistency across different
    types of extractions.
    """
    
    @abstractmethod
    async def extract(self, conversation: List[HumanMessage | AIMessage]) -> T:
        """
        Extracts structured information from a conversation history.
        
        Args:
            conversation: A chronological list of conversation messages
            
        Returns:
            A Pydantic model containing the extracted information
        """
        pass

    def _format_conversation(self, conversation: List[HumanMessage | AIMessage]) -> str:
        """
        Formats conversation history into a clear text format for extraction.
        This helper method ensures consistent formatting across all extractors.
        
        Args:
            conversation: List of conversation messages
            
        Returns:
            Formatted string representation of the conversation
        """
        formatted_messages = []
        for msg in conversation:
            speaker = "User" if isinstance(msg, HumanMessage) else "Assistant"
            formatted_messages.append(f"{speaker}: {msg.content}")
        return "\n".join(formatted_messages)