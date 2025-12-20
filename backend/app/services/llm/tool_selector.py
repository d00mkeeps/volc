import logging
from typing import List, Dict, Any, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.tools.exercise_tool import get_exercises_by_muscle_groups, get_cardio_exercises

logger = logging.getLogger(__name__)

class ToolSelector:
    """
    Fast semantic tool selection using a lightweight model (Gemini 2.5 Flash Lite).
    
    Determines which tools are needed and generates the arguments for them.
    """
    
    def __init__(self, credentials=None, project_id=None):
        # Initialize the fast model
        self.model = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash-lite",
            temperature=0,
            credentials=credentials,
            project=project_id,
            vertexai=True
        )
        
        # Bind tools to the model
        self.tools = [get_exercises_by_muscle_groups, get_cardio_exercises]
        self.model_with_tools = self.model.bind_tools(self.tools)
        
        self.system_prompt = """You are a tool selection assistant that determines which tools are needed to answer the user's fitness coaching request.

**When to call get_exercises_by_muscle_groups:**
Call this tool whenever the user wants to create, plan, or design a workout that involves resistance training. This includes ANY request that needs specific exercises from the database.

Examples that NEED this tool:
- "plan me a chest workout"
- "give me a leg day"
- "I want to hit chest and arms"
- "can you build me a push session?"
- "create a full body routine"
- "what exercises should I do for back?"

**When to call get_cardio_exercises:**
Call this tool when the user specifically wants cardio or conditioning exercises.

Examples that NEED this tool:
- "plan cardio workout"
- "give me some conditioning exercises"
- "what cardio can I do?"

**When NOT to call any tools:**
Do NOT call tools when the user is:
- Analyzing their past performance ("how's my squat progressing?")
- Asking general questions ("what's a good rep range?")
- Just chatting or having a conversation
- Asking about their workout history (data is already loaded)

If unsure whether the user wants to plan a NEW workout, err on the side of calling the tool - it's better to have the exercise data available.
"""

    async def select_tools(self, message: str, history: List[Dict]) -> List[Dict[str, Any]]:
        """
        Determine if tools are needed and return the tool calls.
        
        Args:
            message: User's message
            history: Recent message history (not used in this simple version but kept for interface)
            
        Returns:
            List of tool call dicts: [{'name': 'tool_name', 'args': {...}}, ...]
        """
        try:
            messages = [
                SystemMessage(content=self.system_prompt),
                HumanMessage(content=message)
            ]
            
            # Invoke model
            response = await self.model_with_tools.ainvoke(messages)
            
            tool_calls = []
            if response.tool_calls:
                logger.info(f"🔧 ToolSelector decided to call: {len(response.tool_calls)} tools")
                for tc in response.tool_calls:
                    tool_calls.append({
                        "name": tc["name"],
                        "args": tc["args"]
                    })
                    logger.info(f"  └─ {tc['name']}: {tc['args']}")
            else:
                logger.info("✨ ToolSelector decided NO tools needed")
                
            return tool_calls
            
        except Exception as e:
            logger.error(f"Tool selection failed: {str(e)}")
            return []
