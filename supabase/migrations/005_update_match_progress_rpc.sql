-- Create the update_match_progress RPC to atomically update match scores and answers, preventing race conditions.
CREATE OR REPLACE FUNCTION update_match_progress(
  match_id TEXT,
  player_num INT,
  player_score INT,
  answers JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify caller is one of the players in the match
  IF NOT EXISTS (
    SELECT 1 FROM matches
    WHERE id = match_id
      AND (player1_id = auth.uid() OR player2_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF player_num = 1 THEN
    UPDATE matches
    SET scores = COALESCE(scores, '{}'::jsonb) || jsonb_build_object(
      'player1', player_score,
      'player1_answers', answers
    )
    WHERE id = match_id;
  ELSIF player_num = 2 THEN
    UPDATE matches
    SET scores = COALESCE(scores, '{}'::jsonb) || jsonb_build_object(
      'player2', player_score,
      'player2_answers', answers
    )
    WHERE id = match_id;
  END IF;
END;
$$;
