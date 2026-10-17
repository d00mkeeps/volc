-- Migration: 001_create_staged_workouts.sql
-- Technical Spec: Volc Universal Workout Intake & Staging Pipeline
-- Tables for asynchronous intake, LLM staging, and rapid verification

CREATE TABLE IF NOT EXISTS public.staged_workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    raw_text TEXT NOT NULL,
    reference_timestamp TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'staging' CHECK (status IN ('staging', 'confirmed', 'discarded')),
    parsed_workout JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.staged_workouts ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for authenticated users to manage their own staged workouts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'staged_workouts' AND policyname = 'Users can manage own staged workouts'
  ) THEN
    CREATE POLICY "Users can manage own staged workouts"
        ON public.staged_workouts
        FOR ALL
        TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Index for querying staged workouts by user and status
CREATE INDEX IF NOT EXISTS idx_staged_workouts_user_status ON public.staged_workouts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_staged_workouts_created_at ON public.staged_workouts(created_at DESC);
