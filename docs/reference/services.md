# Technical Reference: Services

The services layer handles the networking and external integrations of the Volc frontend.

---

## `WebSocketService`

A persistent, event-driven service for managing WebSocket connections to the Volc backend orchestration layer.

**Location**: `services/websocket/WebSocketService.ts`

### Connection Management

The service maintains a single active connection, switching endpoints automatically based on the requested task (e.g., switching from `workout-analysis` to `coach`).

- **Base URL**: Dynamically retrieved via `getWsBaseUrl()`.
- **Authentication**: User sessions are handled via `authService.getSession()`.
- **Heartbeat**: Sends a heartbeat every 20 seconds to keep the connection alive.
- **Auto-reconnect**: Implements a backoff strategy (1s, 3s, 5s) for unexpected disconnects.
- **Inactivity Timeout**: Automatically disconnects after 5 minutes of inactivity to save resources.

### Events

Components and stores can subscribe to specific events:

- `onMessage`: Received content chunks for streaming.
- `onThinking`: AI reasoning updates.
- `onStatus`: High-level status messages (e.g., "Analyzing your workout...").
- `onComplete`: Signal that the response generation is finished.
- `onError`: WebSocket or server-side errors.

---

## `api` Services

REST-based services for database interactions and specific tool calls.

**Location**: `services/api/`

### `baseService`

The foundational class for all API interactions, handling:

- **Client Configuration**: Using the shared `apiClient`.
- **Error Handling**: Standardized error parsing and logging.

### `quickChatService`

Fetches contextual suggestions for the chat interface.

- **Method**: `fetchQuickActions(userId, recentMessages)`
- **Purpose**: Power the "quick reply" buttons in the AI coach interface.

### `workoutAnalysisService`

Initiates complex background analysis of workout data.

- **Purpose**: Offloads heavy computation (e.g., cross-referencing sets with historical progress) to the backend.

### `imageService`

Handles uploading and committing workout images.

- **Flow**: Upload (temporary storage) -> Commit (linked to a confirmed workout).
