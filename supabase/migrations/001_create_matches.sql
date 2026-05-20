-- Create matches table for multiplayer game rooms
CREATE TABLE IF NOT EXISTS matches (
  id         TEXT PRIMARY KEY,
  status     TEXT NOT NULL DEFAULT 'waiting'
             CHECK (status IN ('waiting', 'active', 'finished')),
  is_public  BOOLEAN NOT NULL DEFAULT false,
  player1_id UUID NOT NULL,
  player2_id UUID,
  questions  JSONB NOT NULL,
  scores     JSONB,
  winner_id  UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ
);

-- Index for public matchmaking queries
CREATE INDEX IF NOT EXISTS idx_matches_public_waiting
  ON matches (is_public, status)
  WHERE is_public = true AND status = 'waiting';

-- Enable Realtime for the matches table
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
