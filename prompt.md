Phase 4: Database RLS Implementation - Clean Schema Edition
Context & Prerequisites
Phases 1-3 completed with clean database after removing legacy tables. You now have a focused, production schema ready for RLS.
Current Clean Schema Analysis
Tables Needing RLS (7 total):

workouts (user_id) - Core user workouts
conversations (user_id) - User conversations
messages (inherits via conversations) - Chat messages
analysis_bundles (user_id + conversation_id) - Workout analysis data
user_profiles (auth_user_uuid) - User profile data
leaderboard_biceps (user_id) - User leaderboard entries
Child tables: workout_exercises, workout_exercise_sets (inherit via workouts)

Reference Tables (No RLS):

exercise_definitions - Shared exercise library

Already Complete:

images - RLS enabled with full policies ✅

Phase 4 Implementation
Step 4.1: Core User Tables
Enable RLS on primary user-owned tables:

-- Workouts (core table)
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own workouts" ON workouts
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Conversations  
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own conversations" ON conversations
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Analysis bundles (dual access: user_id OR via conversation)
ALTER TABLE analysis_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their analysis bundles" ON analysis_bundles
FOR ALL USING (
auth.uid() = user_id
OR EXISTS (
SELECT 1 FROM conversations c
WHERE c.id = analysis_bundles.conversation_id
AND c.user_id = auth.uid()
)
) WITH CHECK (
auth.uid() = user_id
OR EXISTS (
SELECT 1 FROM conversations c
WHERE c.id = analysis_bundles.conversation_id
AND c.user_id = auth.uid()
)
);

-- Leaderboard entries
ALTER TABLE leaderboard_biceps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their leaderboard entries" ON leaderboard_biceps
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
Step 4.2: User Profiles (Special Case)
User profiles use auth_user_uuid instead of user_id:
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own profile" ON user_profiles
FOR ALL USING (auth.uid() = auth_user_uuid)
WITH CHECK (auth.uid() = auth_user_uuid);
Step 4.3: Child Tables (Inherit Access)
Tables that inherit permissions through parent relationships:
-- Messages (inherit via conversations)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access messages in their conversations" ON messages
FOR ALL USING (
EXISTS (
SELECT 1 FROM conversations c
WHERE c.id = messages.conversation_id
AND c.user_id = auth.uid()
)
) WITH CHECK (
EXISTS (
SELECT 1 FROM conversations c
WHERE c.id = messages.conversation_id
AND c.user_id = auth.uid()
)
);

-- Workout exercises (inherit via workouts)
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access exercises in their workouts" ON workout_exercises
FOR ALL USING (
EXISTS (
SELECT 1 FROM workouts w
WHERE w.id = workout_exercises.workout_id
AND w.user_id = auth.uid()
)
) WITH CHECK (
EXISTS (
SELECT 1 FROM workouts w
WHERE w.id = workout_exercises.workout_id
AND w.user_id = auth.uid()
)
);

-- Workout exercise sets (inherit via workout_exercises -> workouts)
ALTER TABLE workout_exercise_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access sets in their workouts" ON workout_exercise_sets
FOR ALL USING (
EXISTS (
SELECT 1 FROM workout_exercises we
JOIN workouts w ON w.id = we.workout_id
WHERE we.id = workout_exercise_sets.exercise_id
AND w.user_id = auth.uid()
)
) WITH CHECK (
EXISTS (
SELECT 1 FROM workout_exercises we
JOIN workouts w ON w.id = we.workout_id
WHERE we.id = workout_exercise_sets.exercise_id
AND w.user_id = auth.uid()
)
);
Step 4.4: Critical Function Issue
BROKEN FUNCTION DETECTED: create_workout_bundle_with_link references deleted graph_bundles table.
-- This function needs updating to use analysis_bundles instead of graph_bundles
-- Update the INSERT statement to target analysis_bundles table
-- Remove conversation_attachments references if that table was also removed
Step 4.5: Test RLS Policies
Validate with different user contexts:
-- Test with user context
SET request.jwt.claims TO '{"sub": "user1-uuid"}';
SELECT COUNT(\*) FROM workouts; -- Should only see user1's data

SET request.jwt.claims TO '{"sub": "user2-uuid"}';  
SELECT COUNT(\*) FROM workouts; -- Should only see user2's data

-- Test without auth (should see nothing)
RESET request.jwt.claims;
SELECT COUNT(\*) FROM workouts; -- Should return 0
Functions Status Review
These functions should work with RLS:

get_workouts_by_definition_ids ✅ (takes user_id_param)
get_conversations_with_recent_messages ✅ (takes user_id_param)
get_conversation_attachments ✅ (will respect RLS on messages/analysis_bundles)

Needs attention:

create_workout_bundle_with_link ❌ (references deleted tables)

Final Clean Schema
After RLS implementation:

7 tables with user-based RLS policies
1 reference table (exercise_definitions) - no RLS needed
1 table already complete (images)
All functions working with RLS (after fixing broken one)

Validation Checklist
✅ All user-owned tables have RLS enabled
✅ Users can only access their own data
✅ Child tables inherit access properly
✅ Reference tables remain accessible
✅ Existing API operations work unchanged
✅ Broken functions identified and fixed
This is now a surgical, focused RLS implementation! Much cleaner than the original 15+ table mess. Ready to implement?
