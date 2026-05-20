-- Add config column for multiplayer game configuration
ALTER TABLE matches ADD COLUMN IF NOT EXISTS config JSONB NOT NULL DEFAULT '{}'::jsonb;
