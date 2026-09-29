# Technical Spec: Volc Universal Workout Intake & Staging Pipeline

- **Status**: `PLANNED`
- **Target Repo**: [`volc`](file:///Users/miles/Code/projects/volc)
- **Created**: 2026-09-27
- **Architecture**: Asynchronous multi-channel intake (Apple Notes Share Sheet + In-App Scratchpad) $\to$ Ingestion engine $\to$ Staging review modal $\to$ Production commit

---

## 1. System Overview & Objective

Replace the rigid in-workout logging UI with an **asynchronous intake pipeline**. Users record workouts wherever they want (Apple Notes, clipboard, or quick in-app scratchpad) and push raw text into Volc for LLM structuring, date resolution, canonical exercise matching, and rapid verification.

```
[Apple Notes / External Share]           [In-App Scratchpad]
             │                                    │
             ▼ (iOS Share Sheet)                  ▼ (Tap "Stage Workout")
   [iOS Share Extension]                          │
             │ (Writes to App Group)              │
             ▼                                    │
    [expo-share-intent]                           │
             │ (volc:// deep link)                │
             └──────────────────┬─────────────────┘
                                │
                                ▼
                     [Volc App (Expo Router)]
                                │
                                ▼ POST /workouts/stage
                                  { raw_text, reference_timestamp, timezone }
                                │
                   [FastAPI Ingestion Engine]
         ┌──────────────────────┴──────────────────────┐
         ▼                                             ▼
[Contextual Date Resolver]               [Exercise Matcher]
• Anchors "Yesterday", "Tue"             • Injects ExerciseDefinitionCache
• Resolves ISO/UTC timestamp             • Matches standard names & definition_ids
         └──────────────────────┬──────────────────────┘
                                ▼
                 [Gemini Structured Output Parser]
                                │
                                ▼
                 [Supabase: staged_workouts]
                   (status: 'staging', parsed_workout)
                                │
                                ▼
                   [UI: Stage Review Modal]
                   • Date / time picker pre-filled
                   • Matched exercise chips & sets
                   • Inline editing (reps, weight, RPE)
                                │
                                ▼ (Tap "Confirm & Save")
                   [useWorkoutStore.createWorkout()]
         ┌──────────────────────┼──────────────────────┐
         ▼                      ▼                      ▼
  [workouts table]    [workout_exercises]    [workout_exercise_sets]
         │                      │                      │
         └──────────────────────┴──────────────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         ▼                      ▼                      ▼
[1RM & PR Calculator]  [Bicep Leaderboard]    [AI Memory Bundle]
```

---

## 2. Implementation Steps

### Step 1: Database Setup (Supabase)
Create `staged_workouts` table with Row Level Security:
```sql
CREATE TABLE public.staged_workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    raw_text TEXT NOT NULL,
    reference_timestamp TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'staging' CHECK (status IN ('staging', 'confirmed', 'discarded')),
    parsed_workout JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.staged_workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own staged workouts"
    ON public.staged_workouts
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

### Step 2: Backend Ingestion Service (FastAPI)
- **Endpoint**: `POST /workouts/stage` in `backend/app/api/endpoints/staging.py`
  - Accepts `{ raw_text: str, reference_timestamp: str, timezone: str }`
  - Requires auth dependencies (`get_current_user`, `get_jwt_token`)
- **LLM Service** (`backend/app/services/llm/workout_parser_service.py`):
  - Uses Gemini 2.5 Flash / Flash Lite with Pydantic structured output.
  - **Date Resolver**: Parses relative tokens ("Yesterday", "Tuesday", "last night") relative to `reference_timestamp`.
  - **Exercise Matcher**: Injects `ExerciseDefinitionCache` to assign canonical `definition_id`s and standard names.
  - **Sets & Units Extractor**: Extracts weight, reps, RPE, duration, and detected units (`lbs`/`kg`), respecting `is_imperial`.
  - Persists payload to `staged_workouts` and returns parsed JSON.

### Step 3: iOS Native Share Sheet Integration
- **Dependency**: Install `expo-share-intent` (v5+ for Expo SDK 54).
- **Config Plugin (`app.config.js`)**:
  ```javascript
  plugins: [
    // existing plugins...
    [
      "expo-share-intent",
      {
        ios: {
          appGroupId: "group.com.d00mkeeps.Volc",
        },
      },
    ],
  ]
  ```
- **Entitlements (`ios/Volc/Volc.entitlements`)**: Add App Group `group.com.d00mkeeps.Volc`.
- **Regenerate Native Targets**: `npx expo prebuild --clean && cd ios && pod install`.

### Step 4: App Deep Linking & Intent Listener
- **Hook (`hooks/useShareIntentListener.ts`)**:
  - Mounted inside `AuthGate` in `app/_layout.tsx`.
  - Intercepts incoming share intent string when opened via `volc://`.
  - Dispatches `POST /workouts/stage` and navigates to `/stage-review`.

### Step 5: In-App Scratchpad
- **Component (`components/molecules/workout/WorkoutScratchpadSheet.tsx`)**:
  - Clean multiline text input sheet with quick-fill examples.
- **Header Menu (`components/molecules/headers/HomeScreenHeaderMenu.tsx`)**:
  - "+" action menu launches the Scratchpad sheet as the primary intake option.
  - "Stage Workout" button submits text to `/workouts/stage` and opens the review modal.

### Step 6: Review & Commit Modal (`app/stage-review.tsx`)
- **Modal Screen**:
  - Pre-filled date picker (tap to adjust with `@react-native-community/datetimepicker`).
  - Exercise cards with canonical match badges and editable inputs for reps, weight, and RPE.
  - Controls to add/remove sets and add exercises.
- **Save Handler ("Confirm & Save")**:
  - Converts inputs to metric if needed (`toMetricWeight`).
  - Calls `useWorkoutStore.getState().createWorkout()` to trigger production database inserts, e1RM calculations, bicep leaderboard updates, AI bundle regeneration, and dashboard cache invalidation.
  - Updates `staged_workouts` status to `'confirmed'`.
