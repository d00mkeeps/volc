import re
from typing import AsyncGenerator, Set


class StreamingReasoningStripper:
    """
    Async generator that strips specific XML-like tags and their content from a stream.
    Useful for hiding internal LLM reasoning/Chain-of-Thought from end users.
    """

    def __init__(self, tags: Set[str] = None):
        # Default tags if none provided
        self.tags = tags or {"thought", "ready_check", "exercise_reasoning"}

        # Regex to match any of the opening tags: <thought>, <ready_check>, etc.
        self.open_patterns = [f"<{tag}>" for tag in self.tags]
        self.close_patterns = [f"</{tag}>" for tag in self.tags]

        self.buffer = ""
        self.is_hidden = False
        self.active_tag = None

    async def process(
        self, stream: AsyncGenerator[str, None]
    ) -> AsyncGenerator[str, None]:
        """
        Process the input stream and yield only non-stripped content.
        """
        async for chunk in stream:
            if not chunk:
                continue

            self.buffer += chunk

            while self.buffer:
                if not self.is_hidden:
                    # Look for any opening tag
                    earliest_open = -1
                    found_tag = None

                    for tag in self.tags:
                        pos = self.buffer.find(f"<{tag}>")
                        if pos != -1 and (earliest_open == -1 or pos < earliest_open):
                            earliest_open = pos
                            found_tag = tag

                    if earliest_open != -1:
                        # Yield everything before the tag
                        to_yield = self.buffer[:earliest_open]
                        if to_yield:
                            yield to_yield

                        # Enter hidden mode
                        self.is_hidden = True
                        self.active_tag = found_tag
                        # Remove everything up to and including the opening tag
                        self.buffer = self.buffer[
                            earliest_open + len(f"<{found_tag}>") :
                        ]
                    else:
                        # No opening tag found in current buffer.
                        # We need to be careful about partial tags at the end of the buffer.
                        # The longest opening tag is likely <exercise_reasoning> (20 chars)
                        safe_yield_len = max(0, len(self.buffer) - 25)
                        if safe_yield_len > 0:
                            yield self.buffer[:safe_yield_len]
                            self.buffer = self.buffer[safe_yield_len:]
                        break
                else:
                    # Currently hidden, look for the closing tag
                    close_tag = f"</{self.active_tag}>"
                    pos = self.buffer.find(close_tag)

                    if pos != -1:
                        # Found the closing tag!
                        # Discard everything before and including it
                        self.buffer = self.buffer[pos + len(close_tag) :]
                        self.is_hidden = False
                        self.active_tag = None
                    else:
                        # Closing tag not found yet.
                        # We can discard most of the buffer, but keep enough to match split tag.
                        # A closing tag is at most </exercise_reasoning> (21 chars)
                        keep_len = 25
                        if len(self.buffer) > keep_len:
                            # Discard the start, keep the tail
                            self.buffer = self.buffer[-keep_len:]
                        break

        # Final flush of remaining buffer if not hidden
        if not self.is_hidden and self.buffer:
            yield self.buffer
            self.buffer = ""
