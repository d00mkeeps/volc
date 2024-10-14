# Backend Documentation

# LLM Service Documentation

## Table of Contents

1. Introduction
2. System Architecture
3. Configuration
4. Usage
   4.1. Backend Usage
   4.2. Frontend Usage
5. Adding New Configurations
6. Error Handling
7. Best Practices
8. Troubleshooting

## 1. Introduction

The LLM (Language Model) Service is a flexible and robust system designed to interact with the Anthropic API. It allows for multiple configurations to tailor the LLM's behavior for different use cases within the application.

## 2. System Architecture

The LLM Service consists of several key components:

- `Settings`: Manages configuration loading and provides access to LLM configurations.
- `LLMConfig`: Represents a specific configuration for the LLM.
- `LLMService`: Encapsulates the interaction with the Anthropic API.
- `LLMServiceFactory`: Creates `LLMService` instances with the correct configuration.
- `FastAPI Endpoint`: Handles incoming requests and uses the appropriate `LLMService`.

## 3. Configuration

Configurations are defined in the `Settings` class within `app/core/llm_config.py`. Each configuration specifies:

- `model`: The Anthropic model to use.
- `max_tokens`: Maximum number of tokens in the response.
- `temperature`: Controls randomness in the response.
- `system_prompt`: The system prompt that guides the LLM's behavior.

Example configuration:

```python
LLM_CONFIGS: Dict[str, Dict[str, Any]] = {
    "default": {
        "model": "claude-3-5-sonnet-20240620",
        "max_tokens": 250,
        "temperature": 0.5,
        "system_prompt": "Default system prompt here"
    },
    # ... other configurations ...
}
```

4. Usage
   4.1. Backend Usage

To use the LLM Service in the backend:

    Ensure the necessary configurations are defined in Settings.
    Use the FastAPI endpoint to handle requests:

python

@router.post("/process/{config_name}")
async def process_message(
request: ConversationRequest,
config_name: str,
llm_service: LLMService = Depends(get_llm_service)
):
messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
response = await llm_service.process_message(messages)
return {"response": response}

4.2. Frontend Usage

To use the LLM Service from the frontend:

    Make a POST request to the appropriate endpoint:

typescript

const configName = 'example2';
const url = `/api/llm/process/${configName}`;

const response = await fetch(url, {
method: 'POST',
headers: {
'Content-Type': 'application/json',
},
body: JSON.stringify({ messages: conversation }),
});

if (response.ok) {
const result = await response.json();
console.log("LLM Response:", result.response);
}

    Handle the response in your application logic.

5. Adding New Configurations

To add a new configuration:

    Add the configuration to the LLM_CONFIGS dictionary in Settings:

python

"new_config": {
"model": "claude-3-5-sonnet-20240620",
"max_tokens": 300,
"temperature": 0.7,
"system_prompt": "New configuration system prompt"
}

    Use the new configuration by specifying its name in the API endpoint:

/api/llm/process/new_config

6. Error Handling

The LLM Service includes error handling at various levels:

    API level: FastAPI will return appropriate HTTP error codes for invalid requests.
    Service level: The LLMService catches and logs errors from the Anthropic API.
    Application level: Implement appropriate error handling in your frontend code.

7. Best Practices

   Keep system prompts clear and concise.
   Use appropriate max_tokens and temperature settings for your use case.
   Implement proper error handling and user feedback in the frontend.
   Regularly review and update configurations as needed.

8. Troubleshooting

Common issues and their solutions:

    "Configuration not found": Ensure the configuration name in the URL matches a defined configuration.
    API errors: Check the Anthropic API status and your API key.
    Unexpected responses: Review your system prompt and consider adjusting the temperature or max_tokens.

For further assistance, contact miles (aka d00mkeeps aka andy indigo).

This documentation provides a comprehensive overview of the LLM Service, its architecture, how to use it, and how to extend it. You can expand on each section with more specific details, code examples, and use cases as your system evolves.

Some suggestions when using this documentation:

1. Keep it up-to-date as you make changes to the system.
2. Include code comments that reference this documentation for key components.
