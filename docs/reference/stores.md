# Technical Reference: Stores

Volc uses [Zustand](https://github.com/pmndrs/zustand) for lightweight, performant state management. This document provides a detailed reference for the core stores managing chat, workouts, and user sessions.

---

## `useChatStore`

Manages the real-time interaction between the user and the AI coach via WebSockets.

**Location**: `stores/chat/ChatStore.ts`

### State Properties

- `connectionState`: Status of the WebSocket connection (`disconnected`, `connecting`, `connected`, `reconnecting`).
- `loadingState`: Current AI response state (`idle`, `pending`, `streaming`, `complete`).
- `isThinking`: Boolean indicating if the AI is currently in its thinking phase.
- `currentThought`: The latest reasoning chunk received from the assistant.
- `streamingContent`: The cumulative content being streamed for the current message.
- `greeting`: The computed or fetched greeting shown in the chat header.
- `actions`: Contextual quick-actions (e.g., "Plan workout") available to the user.

### Key Methods

- `connect()`: Initializes the WebSocket connection and registers event handlers.
- `sendMessage(content: string)`: Sends a user message, adds an optimistic message to the UI, and manages the thinking/streaming lifecycle.
- `cancelStreaming(reason: string)`: Sends a cancel event to the backend and resets the local loading state.
- `computeGreeting()`: Generates a contextual greeting based on the user's name, history, and time of day.
- `fetchActions()`: Retrieves suggested actions from the `quickChatService`.

---

## `useWorkoutStore`

Handles persistence and synchronization of completed and templated workouts.

**Location**: `stores/workout/WorkoutStore.ts`

### State Properties

- `workouts`: Array of all `CompleteWorkout` objects for the authenticated user.
- `templates`: Subset of workouts flagged as reusable templates.
- `pendingWorkoutsCount`: Number of workouts currently in the offline sync queue.
- `loading`: Boolean for active database operations.

### Key Methods

- `createWorkout(workout: CompleteWorkout)`: Initiates a background save. It uses a **retry queue** to ensure data is saved even if the user is offline.
- `syncPendingWorkouts()`: Manages the offline-to-online synchronization of the `pendingWorkoutQueue`.
- `updateWorkout(workoutId: string, updates: Partial<CompleteWorkout>)`: Updates a workout in the database and the local store.
- `saveAsTemplate(workout: CompleteWorkout)`: Clones a workout as a template for future use.

---

## `useUserSessionStore`

Manages the active, "in-the-gym" workout session.

**Location**: `stores/userSessionStore.ts`

### State Properties

- `currentWorkout`: The `CompleteWorkout` object currently being executed.
- `isActive`: Boolean indicating if a workout session is in progress.
- `elapsedSeconds`: Timer for the current session, adjusted for pauses.
- `isPaused`: Boolean toggle for the session timer.

### Key Methods

- `startWorkout(template: CompleteWorkout)`: Clones a template into an active session and initializes timers.
- `updateExercise(exerciseId, updates)`: Real-time update of sets/reps within the active workout.
- `finishWorkout()`: Cleans up the session state, filters empty sets, and hands off the data to `useWorkoutStore` for persistence.
- `initializeAnalysisAndChat()`: triggers background AI analysis of the workout session to prepare the post-workout coaching conversation.

---

## `useUserStore`

Stores persistent user profile data and preferences.

**Location**: `stores/userProfileStore.ts`

### State Properties

- `userProfile`: Detailed profile including goals, bio, and physiological data.
- `contextBundle`: Metadata bundle used by the AI coach for personalization.
