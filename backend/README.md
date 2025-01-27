# LLM Service Backend Documentation

## Table of Contents

1. Introduction
2. System Architecture
3. Configuration
4. Usage
   4.1. Backend Usage
   4.2. Frontend Usage
5. Streaming Functionality
6. Error Handling
7. Best Practices
8. Troubleshooting

## 1. Introduction

The LLM (Language Model) Service is a flexible and robust system designed to interact with the Anthropic API. It allows for multiple configurations to tailor the LLM's behavior for different use cases within the application. The system supports streaming responses, enabling real-time interaction with the LLM.

## 2. System Architecture

The LLM Service consists of several key components:

- `main.py`: The main FastAPI application entry point.
- `llm_config.py`: Manages configuration loading and provides access to LLM configurations.
- `llm_service.py`: Encapsulates the interaction with the Anthropic API and handles streaming.
- `llm.py`: Contains the FastAPI router with endpoints for LLM interactions.

## 3. Configuration

Configurations are defined in the `Settings` class within `app/core/llm_config.py`. Each configuration specifies:

- `model`: The Anthropic model to use.
- `max_tokens`: Maximum number of tokens in the response.
- `temperature`: Controls randomness in the response.
- `system_prompt`: The system prompt that guides the LLM's behavior.

Example configuration:

/_
LLM_CONFIGS: Dict[str, Dict[str, Any]] = {
"default": {
"model": "claude-3-5-sonnet-20240620",
"max_tokens": 250,
"temperature": 0.5,
"system_prompt": "Default system prompt here"
},
"welcome": {
"model": "claude-3-5-sonnet-20240620",
"max_tokens": 250,
"temperature": 0.5,
"system_prompt": "Welcome scenario system prompt here"
}
}
_/

## 4. Usage

### 4.1. Backend Usage

To use the LLM Service in the backend:

1. Ensure the necessary configurations are defined in Settings.
2. Use the FastAPI endpoint to handle streaming requests:

/_
@router.post("/process_stream/{config_name}")
async def process_message_stream(
request: ConversationRequest,
config_name: str,
llm_service: LLMService = Depends(get_llm_service)
):
messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
return StreamingResponse(event_generator(), media_type="text/event-stream")
_/

### 4.2. Frontend Usage

To use the LLM Service from the frontend:

1. Make a POST request to the streaming endpoint:

/\*
const configName = 'default';
const url = `/api/llm/process_stream/${configName}`;

const response = await fetch(url, {
method: 'POST',
headers: {
'Content-Type': 'application/json',
},
body: JSON.stringify({ messages: conversation }),
});

if (response.ok) {
const reader = response.body.getReader();
// Process the streamed response
}
\*/

2. Handle the streamed response in your application logic.

## 5. Streaming Functionality

The streaming functionality is implemented as follows:

1. The LLMService uses Anthropic's AsyncAnthropic client to create a streaming response.
2. The FastAPI endpoint uses StreamingResponse to send server-sent events (SSE).
3. The event_generator function yields chunks of data as they are received from the LLM.

Example of streaming implementation in LLMService:

/_
async def process_message_stream(self, messages: List[Dict[str, str]]) -> AsyncStream:
stream = await self.client.messages.create(
model=self.config.model,
max_tokens=self.config.max_tokens,
temperature=self.config.temperature,
system=self.config.system_prompt,
messages=messages,
stream=True
)
return stream
_/

## 6. Error Handling

The system includes error handling at various levels:

- API level: FastAPI will return appropriate HTTP error codes for invalid requests.
- Service level: The LLMService catches and logs errors from the Anthropic API.
- Streaming level: Errors during streaming are caught and sent as error events to the client.

## 7. Best Practices

- Keep system prompts clear and concise in the configuration.
- Use appropriate max_tokens and temperature settings for your use case.
- Implement proper error handling and user feedback in the frontend.
- Regularly review and update configurations as needed.

## 8. Troubleshooting

Common issues and their solutions:

- "Configuration not found": Ensure the configuration name in the URL matches a defined configuration.
- API errors: Check the Anthropic API status and your API key.
- Streaming issues: Verify that your frontend can handle server-sent events properly.

For further assistance, check the logs or contact the system administrator.

This documentation provides an overview of the current LLM Service backend system, its architecture, how to use it, and its streaming capabilities. Expand on each section with more specific details and use cases as your system evolves.
