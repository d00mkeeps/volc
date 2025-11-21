-- Migration: Add LLM performance metrics columns to usage_logs
-- Created: 2025-11-20

-- Add new columns for LLM-specific metrics
ALTER TABLE usage_logs
ADD COLUMN IF NOT EXISTS input_tokens INTEGER,
ADD COLUMN IF NOT EXISTS output_tokens INTEGER,
ADD COLUMN IF NOT EXISTS model_name TEXT,
ADD COLUMN IF NOT EXISTS endpoint_type TEXT;

-- Create index on endpoint_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_usage_logs_endpoint_type ON usage_logs(endpoint_type);

-- Create index on timestamp for time-based queries
CREATE INDEX IF NOT EXISTS idx_usage_logs_timestamp ON usage_logs(timestamp DESC);

-- Add comment to document the schema
COMMENT ON COLUMN usage_logs.input_tokens IS 'Number of tokens in the LLM prompt/input';
COMMENT ON COLUMN usage_logs.output_tokens IS 'Number of tokens in the LLM response/output';
COMMENT ON COLUMN usage_logs.model_name IS 'Name of the LLM model used (e.g., gemini-2.5-flash)';
COMMENT ON COLUMN usage_logs.endpoint_type IS 'Type of endpoint: llm, api, etc.';
