import logging
import asyncio
from typing import Any, Dict, List, Optional, AsyncGenerator
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception,
    before_sleep_log,
)
from langchain_google_genai import ChatGoogleGenerativeAI

logger = logging.getLogger(__name__)

def is_rate_limit_error(exception: Exception) -> bool:
    """Check if the exception is a 429 Rate Limit error."""
    error_str = str(exception).lower()
    return (
        "429" in error_str
        or "resource exhausted" in error_str
        or "too many requests" in error_str
    )

class BaseLLMService:
    """
    Base class for LLM-powered services.
    Provides standardized model initialization and robust retry logic for 429 errors.
    """

    def __init__(
        self,
        model_name: str,
        temperature: float = 0.0,
        streaming: bool = False,
        credentials: Any = None,
        project_id: Optional[str] = None,
        **kwargs: Any,
    ):
        self.model_name = model_name
        self.temperature = temperature
        self.streaming = streaming
        self.credentials = credentials
        self.project_id = project_id

        # Native Reasoning Parameters
        # These are passed via extra arguments to handle different SDK versions safely
        self.model_kwargs = {}
        if kwargs.get("thinking_budget"):
            self.model_kwargs["thinking_budget"] = kwargs["thinking_budget"]
        if kwargs.get("include_thoughts"):
            self.model_kwargs["include_thoughts"] = kwargs["include_thoughts"]

        self.llm = ChatGoogleGenerativeAI(
            model=model_name,
            temperature=temperature,
            streaming=streaming,
            credentials=credentials,
            project=project_id,
            vertexai=True,
            **self.model_kwargs,
        )

    def bind_tools(self, tools: List[Any]):
        """Bind tools to the underlying LLM."""
        self.llm = self.llm.bind_tools(tools)
        return self

    @retry(
        retry=retry_if_exception(is_rate_limit_error),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        stop=stop_after_attempt(5),
        before_sleep=before_sleep_log(logger, logging.WARNING),
        reraise=True,
    )
    async def _call_with_retry(self, func, *args, **kwargs):
        """Internal wrapper to execute a function with exponential backoff on 429s."""
        return await func(*args, **kwargs)

    async def invoke(self, input_data: Any, **kwargs) -> Any:
        """Invoke the LLM with retry logic."""
        return await self._call_with_retry(self.llm.ainvoke, input_data, **kwargs)

    async def stream(self, input_data: Any, **kwargs) -> AsyncGenerator[Any, None]:
        """
        Stream from the LLM with retry logic for the initial connection.
        Note: Tenacity doesn't easily wrap an entire async generator, 
        so we wrap the initial call if possible or handle chunks.
        """
        # For streaming, we'll use a manual retry loop for the generator creation
        # to ensure we catch 429s that happen at the start of the stream.
        max_retries = 5
        for attempt in range(max_retries):
            try:
                # Test the connection or just try to start the stream
                async for chunk in self.llm.astream(input_data, **kwargs):
                    yield chunk
                return  # Success
            except Exception as e:
                if is_rate_limit_error(e) and attempt < max_retries - 1:
                    wait_time = (2**attempt) + 1  # 2, 3, 5, 9s backoff
                    logger.warning(
                        f"Rate limited during stream (429), retrying in {wait_time}s (attempt {attempt + 1}/{max_retries})"
                    )
                    await asyncio.sleep(wait_time)
                else:
                    raise
