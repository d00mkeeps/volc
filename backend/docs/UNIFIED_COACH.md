# Unified Coach Service Documentation

## Overview

The Unified Coach Service provides a single WebSocket endpoint for all fitness coaching interactions - workout planning, progress analysis, and general advice - through one continuous conversation.

**Endpoint:** `ws://localhost:8000/api/llm/coach/{user_id}`

## Why Unified?

**Before:** Separate endpoints for planning (`/workout-planning`) and analysis (`/workout-analysis`)
- ❌ Fragmented conversations
- ❌ Duplicate context loading
- ❌ Manual mode switching

**Now:** Single endpoint for everything
- ✅ One continuous conversation
- ✅ Automatic mode detection
- ✅ Seamless switching between planning and analysis

## How It Works

### Architecture

```
1. Client connects → WebSocket established
2. Context loads once → User profile + workout history + AI memory
3. For each message:
   ├─ Tool Selector (Gemini 2.5 Flash Lite) decides if tools needed
   ├─ Tools execute (e.g., fetch exercises from database)
   ├─ Prompt built with context + tool results
   ├─ Response generated (Gemini 2.5 Flash)
   └─ JSON components extracted (workout_template, chart_data)
```

### Smart Tool Selection

The system automatically determines what data to fetch:

| User Message | Tools Called | Why |
|--------------|--------------|-----|
| "plan a chest workout" | `get_exercises_by_muscle_groups(["chest", "triceps"])` | Need exercise database |
| "how's my squat?" | None | Uses cached workout data |
| "plan cardio" | `get_cardio_exercises()` | Need cardio exercises |

No manual routing needed - the AI figures it out.

## Usage

### Connecting

```javascript
const userId = 'user-123';
const ws = new WebSocket(`ws://localhost:8000/api/llm/coach/${userId}`);

ws.onopen = () => console.log('Connected');

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleMessage(data);
};
```

### Sending Messages

```javascript
// Just send the message - system handles the rest
ws.send(JSON.stringify({
    message: "plan me a leg workout"
}));
```

### Receiving Responses

The system streams responses with different event types:

#### 1. Connection Status
```json
{"type": "connection_status", "data": "connected"}
```

#### 2. Streaming Content
```json
{"type": "content", "data": "Here's a solid leg session:\n"}
{"type": "content", "data": "\n```json\n{...}\n```\n"}
```

#### 3. Workout Template Component
```json
{
    "type": "workout_template",
    "data": {
        "name": "Leg Focused Session",
        "notes": "Focus on controlled tempo...",
        "workout_exercises": [
            {
                "definition_id": "uuid-here",
                "name": "Barbell Back Squat",
                "notes": "- Keep core tight\\n- Drive through heels",
                "order_index": 0,
                "workout_exercise_sets": [
                    {"set_number": 1, "reps": 6, "weight": null},
                    {"set_number": 2, "reps": 6, "weight": null}
                ]
            }
        ]
    }
}
```

#### 4. Chart Data Component
```json
{
    "type": "chart_data",
    "data": {
        "title": "Squat e1RM Progress",
        "chart_type": "line",
        "labels": ["Nov 01", "Nov 15", "Dec 01"],
        "datasets": [
            {
                "label": "Squat e1RM (kg)",
                "data": [140, 147, 155],
                "color": "#3b82f6"
            }
        ]
    }
}
```

#### 5. Completion Signal
```json
{"type": "complete", "data": {"length": 523}}
```

#### 6. Errors
```json
{
    "type": "error",
    "data": {
        "code": "rate_limit",
        "message": "Rate limit exceeded",
        "retry_after": 60
    }
}
```

### Example Handler

```javascript
function handleMessage(data) {
    switch(data.type) {
        case 'connection_status':
            console.log('Connected:', data.data);
            break;
            
        case 'content':
            // Append streaming text
            appendToChat(data.data);
            break;
            
        case 'workout_template':
            // Render workout UI component
            renderWorkout(data.data);
            break;
            
        case 'chart_data':
            // Render progress chart
            renderChart(data.data);
            break;
            
        case 'complete':
            // Message complete, finalize UI
            finalizeMessage();
            break;
            
        case 'error':
            showError(data.data.message);
            break;
    }
}
```

## Example Conversations

### Planning Workflow

```javascript
// User sends
ws.send(JSON.stringify({message: "plan me a chest workout"}));

// System does:
// 1. ToolSelector decides to fetch chest exercises
// 2. Fetches ~25 exercises from database
// 3. Builds prompt with user context + exercises
// 4. Generates workout template

// You receive:
// - Multiple {"type": "content", "data": "..."} chunks
// - One {"type": "workout_template", "data": {...}}
// - One {"type": "complete", "data": {...}}
```

### Analysis Workflow

```javascript
// User sends
ws.send(JSON.stringify({message: "how's my squat progressing?"}));

// System does:
// 1. ToolSelector decides no tools needed
// 2. Analyzes workout history (already loaded)
// 3. Generates analysis + optional chart

// You receive:
// - Content chunks with analysis text
// - Optional {"type": "chart_data", "data": {...}}
// - Completion signal
```

### Mode Switching (Same Connection!)

```javascript
// First: Analysis
ws.send(JSON.stringify({message: "how's my bench?"}));
// → Receives analysis + chart

// Then: Planning (no reconnection needed!)
ws.send(JSON.stringify({message: "plan me a push day"}));
// → Receives workout template
```

## Context Loading

On connection, the system loads:

1. **User Profile**
   - Name, age, preferred units (kg/lb)

2. **AI Memory**
   - Goals, injuries, equipment access
   - Training preferences, nutrition notes

3. **Workout History**
   - Recent workouts (last 14 days)
   - Exercise performance trends
   - Personal records

This context stays loaded for the entire session - no reloading needed.

## Heartbeats (Optional)

Keep connection alive with periodic heartbeats:

```javascript
setInterval(() => {
    ws.send(JSON.stringify({
        type: 'heartbeat',
        timestamp: new Date().toISOString()
    }));
}, 30000); // Every 30 seconds

// Listen for acknowledgment
if (data.type === 'heartbeat_ack') {
    console.log('Connection alive');
}
```

## Migration from Legacy Endpoints

### Old System
```javascript
// For planning
const planWs = new WebSocket('/api/llm/workout-planning/user-123');

// For analysis
const analysisWs = new WebSocket('/api/llm/workout-analysis/conv-456/user-123');

// Different connections, manual coordination
```

### New System
```javascript
// One connection, automatic coordination
const coachWs = new WebSocket('/api/llm/coach/user-123');
```

**Message format:** Unchanged  
**Component schemas:** Unchanged  
**Frontend rendering:** No changes needed

## Components Reference

### workout_template
Generated when user requests a workout plan.

**Required fields:**
- `name` (string) - Workout name
- `notes` (string) - Overall workout notes
- `workout_exercises` (array) - List of exercises

**Exercise structure:**
- `definition_id` (UUID) - Exercise ID from database
- `name` (string) - Exercise name
- `notes` (string) - Exercise-specific notes (use `\\n` for line breaks)
- `order_index` (int) - Exercise order
- `workout_exercise_sets` (array) - Sets with `set_number`, `reps`, `weight`

### chart_data
Generated when analyzing progress over time.

**Required fields:**
- `title` (string) - Chart title
- `chart_type` (string) - "line" or "bar"
- `labels` (array) - X-axis labels (dates: "DD/MM" format)
- `datasets` (array) - Data series

**Dataset structure:**
- `label` (string) - Series name
- `data` (array) - Numeric values
- `color` (string) - Hex color code

## Troubleshooting

### Connection fails
- Verify backend is running
- Check user_id is valid
- Ensure correct port (default: 8000)

### No response after sending message
- Check backend logs for errors
- Verify WebSocket state is OPEN
- Check message format (JSON with "message" field)

### Component doesn't render
- Verify `type` field matches handler
- Check JSON structure matches schema
- Log raw data to inspect format

### Context seems empty
- User may not have profile or workouts in database
- Check backend logs: "has_profile" and "has_bundle" flags
- System will gracefully handle missing data

## Backend Components

For developers working on the backend:

**Key files:**
- `app/services/llm/unified_coach_service.py` - Main orchestrator
- `app/services/llm/tool_selector.py` - Smart tool selection
- `app/services/context/shared_context_loader.py` - Context loading
- `app/core/prompts/unified_coach.py` - System prompt
- `app/api/endpoints/llm.py` - WebSocket endpoint

**Dependencies:**
- FastAPI (WebSockets)
- LangChain (tool binding)
- Google Vertex AI (Gemini models)
- Supabase (database)

## Support

**Legacy endpoints still available:**
- `/api/llm/workout-planning/{user_id}` ✅ Active
- `/api/llm/workout-analysis/{conversation_id}/{user_id}` ✅ Active

Both can run alongside the unified endpoint during migration.
