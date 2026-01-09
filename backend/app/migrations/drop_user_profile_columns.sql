-- Migration: Drop unused columns from user_profiles
-- Executed via MCP tool on 2026-01-08

ALTER TABLE user_profiles 
DROP COLUMN IF EXISTS goals,
DROP COLUMN IF EXISTS current_stats,
DROP COLUMN IF EXISTS preferences,
DROP COLUMN IF EXISTS instagram_username,
DROP COLUMN IF EXISTS age,
DROP COLUMN IF EXISTS ai_memory,
DROP COLUMN IF EXISTS full_name;
